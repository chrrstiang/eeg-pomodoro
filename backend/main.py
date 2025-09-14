from typing import Union

from fastapi import FastAPI, UploadFile, File, HTTPException

from pydantic import BaseModel

from eeg_extraction import calculate_tbr

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
    tbr_score = calculate_tbr(file.file)

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



