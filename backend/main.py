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
        WINDOW_SIZE_SECONDS = 1
        
        total_seconds = len(df) // SAMPLES_PER_SECOND
        
        for second in range(0, total_seconds - WINDOW_SIZE_SECONDS + 1, WINDOW_SIZE_SECONDS):
            start_second = second + 1  # Make it 1-based for display
            end_second = min(second + WINDOW_SIZE_SECONDS, total_seconds)
            start_idx = second * SAMPLES_PER_SECOND
            end_idx = min((second + WINDOW_SIZE_SECONDS) * SAMPLES_PER_SECOND, len(df))
            
            if start_idx >= len(df):
                break
                
            # Get the data from the window
            window = df.iloc[start_idx:end_idx]
            eeg_segment = window[16].values
            
            # Process the window
            theta_power, beta_power, frequencies, power_density = process_eeg_segment(eeg_segment)

            focus_score = theta_power/beta_power
            
            print(f"Focus score for seconds {start_second}-{end_second}: {theta_power}/{beta_power} = {focus_score:.2f}")
            
            await websocket.send_json({
                "start_second": start_second,
                "end_second": end_second,
                "focus_score": round(focus_score, 2) if focus_score is not None else None,
                "theta_power": round(theta_power, 2) if theta_power is not None else None,
                "beta_power": round(beta_power, 2) if beta_power is not None else None,
                "spectrum": {
                    "frequencies": frequencies.tolist(),
                    "power_density": power_density.tolist()
                }
            })
            
            # Sleep for the duration of the window to simulate real-time processing
            await asyncio.sleep(WINDOW_SIZE_SECONDS)

    except Exception as e:
        await websocket.send_json({"error": str(e)})

    await websocket.close()
    print("WebSocket connection closed.")



