import os
import asyncio
import google.generativeai as genai
from typing import Optional, Union
from dotenv import load_dotenv

load_dotenv()


class GeminiService:
    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or "gemini-2.5-flash-lite"

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(self.model_name)

    # ─────────────────────────────────────────
    # BASIC GENERATION
    # ─────────────────────────────────────────

    def generate(
        self,
        prompt: Union[str, list],
        temperature: float = 0.7,
        max_tokens: int = 8192
    ) -> str:
        response = self.model.generate_content(
            prompt,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_tokens,
            }
        )
        return response.text if hasattr(response, "text") and response.text else ""

    # ─────────────────────────────────────────
    # ASYNC GENERATION — needed for parallel calls
    # ─────────────────────────────────────────

    async def generate_async(
        self,
        prompt: Union[str, list],
        temperature: float = 0.7,
        max_tokens: int = 8192
    ) -> str:
        """
        Async wrapper so asyncio.gather works
        for running 5 analysts in parallel
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: self.generate(prompt, temperature, max_tokens)
        )

    # ─────────────────────────────────────────
    # STREAMING — for debate agent live UI
    # ─────────────────────────────────────────

    def generate_stream(
        self,
        prompt: Union[str, list],
        temperature: float = 0.7,
        max_tokens: int = 8192
    ):
        response = self.model.generate_content(
            prompt,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_tokens,
            },
            stream=True
        )
        for chunk in response:
            if hasattr(chunk, "text") and chunk.text:
                yield chunk.text

    async def generate_stream_async(
        self,
        prompt: Union[str, list],
        temperature: float = 0.7,
        max_tokens: int = 8192
    ):
        """
        Async streaming — for SSE debate streaming
        """
        loop = asyncio.get_event_loop()

        response = await loop.run_in_executor(
            None,
            lambda: self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                },
                stream=True
            )
        )

        for chunk in response:
            if hasattr(chunk, "text") and chunk.text:
                yield chunk.text

    # ─────────────────────────────────────────
    # UPLOAD SINGLE FILE — returns Gemini file ref
    # ─────────────────────────────────────────

    def upload_file(self, file_path: str) -> genai.types.File:
        """
        Upload one file to Gemini File API
        Supports PDF, DOCX, TXT, etc.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        # Map extensions to MIME types
        ext = os.path.splitext(file_path)[1].lower()
        mime_map = {
            ".pdf": "application/pdf",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt": "text/plain",
            ".md": "text/markdown"
        }
        
        mime_type = mime_map.get(ext, "application/octet-stream")

        uploaded_file = genai.upload_file(
            path=file_path,
            mime_type=mime_type
        )

        return uploaded_file

    # ─────────────────────────────────────────
    # UPLOAD MULTIPLE FILES — for all vendor docs
    # ─────────────────────────────────────────

    def upload_multiple_files(
        self,
        file_paths: list[str]
    ) -> list[genai.types.File]:
        """
        Upload all vendor documents to Gemini File API
        """
        uploaded_files = []

        for path in file_paths:
            uploaded_file = self.upload_file(path)
            uploaded_files.append(uploaded_file)

        return uploaded_files

    # ─────────────────────────────────────────
    # GENERATE FROM FILES — core analyst method
    # ─────────────────────────────────────────

    async def generate_from_files_async(
        self,
        gemini_file_refs: list,
        prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 8192
    ) -> str:
        """
        Pass multiple uploaded file references + prompt to Gemini
        Used by all 5 analyst agents
        Low temperature for factual extraction
        """
        # Build multimodal prompt — files first then text
        multimodal_prompt = [*gemini_file_refs, prompt]

        return await self.generate_async(
            multimodal_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )

    # ─────────────────────────────────────────
    # GENERATE FROM TEXT — for debate rounds
    # ─────────────────────────────────────────

    async def generate_from_text_async(
        self,
        prompt: str,
        temperature: float = 0.8,
        max_tokens: int = 4096
    ) -> str:
        """
        Text only generation for debate agents
        Higher temperature for more natural argument style
        Debate rounds don't need PDFs — they read DB outputs
        """
        return await self.generate_async(
            prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )

    async def generate_stream_text_async(
        self,
        prompt: str,
        temperature: float = 0.8,
        max_tokens: int = 4096
    ):
        """
        Streaming text generation for live debate UI
        Each token streams to frontend via SSE
        """
        async for chunk in self.generate_stream_async(
            prompt,
            temperature=temperature,
            max_tokens=max_tokens
        ):
            yield chunk

    # ─────────────────────────────────────────
    # CLEANUP — delete uploaded files from Gemini
    # ─────────────────────────────────────────

    def cleanup_uploaded_files(
        self,
        gemini_file_refs: list
    ) -> None:
        """
        Delete uploaded PDFs from Gemini File API
        after all analysts are done
        Call this after Phase 0 completes
        """
        for file_ref in gemini_file_refs:
            try:
                genai.delete_file(file_ref.name)
            except Exception:
                pass