from fastapi import FastAPI

app = FastAPI()

@app.post("/heartbeat")
def heartbeat():
    return {"status": "ok", "message": "Heartbeat received"}

@app.post("/process")
def process_transaction(data: dict):
    # For now always approve
    return {"approved": True, "approval_code": "123456"}
