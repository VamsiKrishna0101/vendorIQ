from services.gemini_service import GeminiService
gemini = GeminiService()

# TEXT TEST

response = gemini.generate(f"tell me a funny joke")
print("TEXT RESPONSE:\n", response)


# PDF TEST (optional)
# response_pdf = gemini.generate_from_pdf("tests/sample.pdf", "Summarize this document")
# print("PDF RESPONSE:\n", response_pdf)