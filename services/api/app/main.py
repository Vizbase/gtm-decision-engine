from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.app.api.analysis import router as analysis_router
from services.api.app.api.companies import router as companies_router


app = FastAPI(
    title="GTM Decision Engine API",
    version="0.1.0",
    description=(
        "Account enrichment, ICP scoring, CRM context, "
        "prioritization, and GTM decision recommendations."
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(companies_router)
app.include_router(analysis_router)


@app.get("/")
def root():
    return {
        "name": "GTM Decision Engine",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }
