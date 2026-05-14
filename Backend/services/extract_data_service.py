import os
import json
import asyncio
from typing import List, Dict
from sqlalchemy.orm import Session
from datetime import datetime
from services.gemini_service import GeminiService
from services.session_event_bus import event_bus
from models.Intelligence import Intelligence
from prompts.analyst_prompts import (
    FINANCIAL_ANALYST_PROMPT,
    TECHNICAL_ANALYST_PROMPT,
    COMPLIANCE_ANALYST_PROMPT,
    MARKET_ANALYST_PROMPT,
    CUSTOMER_SENTIMENT_PROMPT
)


class ExtractData:
    def __init__(self, db: Session):
        self.gemini = GeminiService()
        self.db = db

    async def extract_data(
        self,
        path_lists: List[str],
        vendor_names: List[str],
        session_id: str
    ) -> Dict:

        # Step 1 — Upload all files to Gemini once
        gemini_file_refs = self.gemini.upload_multiple_files(path_lists)

        try:
            vendor_list_str = ", ".join(vendor_names)

            # Step 2 — Build prompts
            prompts = {
                "financial":          FINANCIAL_ANALYST_PROMPT.format(vendor_names=vendor_list_str, pdf_content="(Refer to attached files)"),
                "technical":          TECHNICAL_ANALYST_PROMPT.format(vendor_names=vendor_list_str, pdf_content="(Refer to attached files)"),
                "compliance":         COMPLIANCE_ANALYST_PROMPT.format(vendor_names=vendor_list_str, pdf_content="(Refer to attached files)"),
                "market":             MARKET_ANALYST_PROMPT.format(vendor_names=vendor_list_str, pdf_content="(Refer to attached files)"),
                "customer_sentiment": CUSTOMER_SENTIMENT_PROMPT.format(vendor_names=vendor_list_str, pdf_content="(Refer to attached files)"),
            }

            # Step 3 — Run all 5 in parallel
            analyst_types = list(prompts.keys())
            
            async def run_analyst(a_type: str, prompt: str):
                res = await self.gemini.generate_from_files_async(gemini_file_refs, prompt)
                complete_event = {
                    "event_type": "agent_completed",
                    "agent_id": a_type,
                    "agent_type": "analyst",
                    "round_number": 0,
                    "content": "Extraction complete. Data structured and saved.",
                    "timestamp": datetime.utcnow().isoformat()
                }
                await event_bus.put_event(session_id, complete_event)
                return res

            results = await asyncio.gather(
                *[
                    run_analyst(a_type, prompt)
                    for a_type, prompt in prompts.items()
                ],
                return_exceptions=True
            )

            # Step 4 — Parse + save each result
            intelligence = {}

            for analyst_type, result in zip(analyst_types, results):

                if isinstance(result, Exception):
                    intelligence[analyst_type] = {
                        "analyst_type": analyst_type,
                        "error": str(result),
                        "status": "failed"
                    }
                    continue

                parsed = self._parse_json(result, analyst_type)

                # Save to DB immediately
                self._save_to_db(
                    session_id=session_id,
                    analyst_type=analyst_type,
                    content=parsed,
                    confidence=parsed.get("confidence_per_vendor", {})
                )

                intelligence[analyst_type] = parsed

            return {
                "session_id": session_id,
                "vendor_names": vendor_names,
                "intelligence": intelligence,
                "status": "completed"
            }

        finally:
            self.gemini.cleanup_uploaded_files(gemini_file_refs)

    def _save_to_db(
        self,
        session_id: str,
        analyst_type: str,
        content: Dict,
        confidence: Dict
    ) -> None:
        """
        Save one analyst output to DB
        Called immediately after each analyst completes
        """
        record = Intelligence(
            session_id   = session_id,
            analyst_type = analyst_type,
            content      = content,
            confidence   = confidence.get("overall", 0.0) if confidence else 0.0
        )
        self.db.add(record)
        self.db.commit()

    def _parse_json(self, raw_text: str, analyst_type: str) -> Dict:
        try:
            cleaned = raw_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
                cleaned = cleaned.strip()

            parsed = json.loads(cleaned)
            parsed["status"] = "success"
            return parsed

        except json.JSONDecodeError as e:
            return {
                "analyst_type": analyst_type,
                "raw_response": raw_text,
                "parse_error": str(e),
                "status": "parse_failed"
            }