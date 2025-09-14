import io
import pandas as pd
import base64
import asyncio

from fastapi import FastAPI, WebSocket

from eeg_extraction import process_eeg_segment

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Websocket accepted")

    try:
        base64_string = await websocket.receive_text()
        print("File received. Starting to process...")

        file_bytes = base64.b64decode(base64_string)

        csv_file_stream = io.BytesIO(file_bytes)

        # Read the entire file at once since we need to process it in 3-second windows
        csv_file_stream.seek(0)
        df = pd.read_csv(csv_file_stream, header=None)
        
        # Assuming 500Hz sampling rate (500 samples per second)
        SAMPLES_PER_SECOND = 500
        WINDOW_SIZE = 3 * SAMPLES_PER_SECOND  # 3 seconds of data
        
        total_seconds = len(df) // SAMPLES_PER_SECOND
        
        window_size = 3  # 3-second windows
        for second in range(0, total_seconds - window_size + 1, window_size):
            start_second = second + 1  # Make it 1-based for display
            end_second = min(second + window_size, total_seconds)
            start_idx = second * SAMPLES_PER_SECOND
            end_idx = min((second + window_size) * SAMPLES_PER_SECOND, len(df))
            
            if start_idx >= len(df):
                break
                
            # Get the 3-second window
            window = df.iloc[start_idx:end_idx]
            eeg_segment = window[16].values
            
            # Process the 3-second window
            focus_score = process_eeg_segment(eeg_segment)
            
            print(f"Focus score for seconds {start_second}-{end_second}: {focus_score:.2f}")
            
            await websocket.send_json({
                "start_second": start_second,
                "end_second": end_second,
                "focus_score": round(focus_score, 2) if focus_score is not None else None
            })
            
            # Sleep for the duration of the window to simulate real-time processing
            await asyncio.sleep(window_size)

    except Exception as e:
        await websocket.send_json({"error": str(e)})

    await websocket.close()
    print("WebSocket connection closed.")



