from typing import Union
import io
import time
import pandas as pd
import base64

from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket

from pydantic import BaseModel

from eeg_extraction import process_eeg_segment, process_eeg_file

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float
    is_offer: Union[bool, None] = None


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

@app.put("/items/{item_id}")
def update_item(item_id: int, item: Item):
    return {"item_name": item.name, "item_id": item_id}

@app.post("/process-eeg")
async def process_eeg_file(file: UploadFile = File(...)):
    # 1. Basic validation
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="File must be a CSV."
        )

    # 2. Process the file content
    tbr_score = process_eeg_file(file.file)

    # 3. Return a response
    if tbr_score is not None:
        return {
            "message": "Processing successful",
            "focus_score": round(tbr_score, 2)
        }
    else:
        raise HTTPException(
            status_code=500,
            detail="Could not calculate a valid focus score."
        )

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Websocket accepted")

    try:
        base64_string = await websocket.receive_text()
        print("File received. Starting to process...")

        file_bytes = base64.b64decode(base64_string)

        csv_file_stream = io.BytesIO(file_bytes)

        # Read the file in chunks to simulate a real-time stream
        CHUNK_SIZE = 500
        # The stream needs to be reset to the beginning after reading bytes
        csv_file_stream.seek(0)
        chunks = pd.read_csv(csv_file_stream, chunksize=CHUNK_SIZE, header=None)

        for i, chunk in enumerate(chunks):
            eeg_segment = chunk[16].values
            focus_score = process_eeg_segment(eeg_segment)

            print(f"Focus score, second {i + 1}: {focus_score:.2f}")

            await websocket.send_json({
                "second": i + 1,
                "focus_score": round(focus_score, 2) if focus_score is not None else None
            })

            time.sleep(1)

    except Exception as e:
        await websocket.send_json({"error": str(e)})

    await websocket.close()
    print("WebSocket connection closed.")



