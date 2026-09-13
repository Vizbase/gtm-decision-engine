from fastapi import FastAPI

from services.api.app.api.companies import router as companies_router

app = FastAPI(
    title="GTM Decision Engine API",
    version="0.1.0",
)

app.include_router(companies_router)


@app.get("/")
def root():
    return {
        "name": "GTM Decision Engine",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
