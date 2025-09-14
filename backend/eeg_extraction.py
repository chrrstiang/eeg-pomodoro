import pandas as pd
from scipy.signal import welch
import numpy as np
import time
import io

# --- 1. Define Constants ---
SAMPLING_RATE = 500  # Hz
ELECTRODE_INDEX = 16  # Fz electrode
CHUNK_SIZE = SAMPLING_RATE  # 1-second window for the focus score

# --- 2. Define Frequency Bands ---
theta_band = (4, 8)  # Hz
beta_band = (13, 30)  # Hz

def process_eeg_segment(eeg_segment):
    """
    Processes a 1-second segment of EEG data and returns the TBR.
    """
    # Perform the Welch method
    frequencies, power_density = welch(
        eeg_segment,
        fs=SAMPLING_RATE,
        nperseg=CHUNK_SIZE,
        scaling='density'
    )

    # Calculate power in each band
    theta_indices = np.where(
        (frequencies >= theta_band[0]) & (frequencies <= theta_band[1])
    )
    beta_indices = np.where(
        (frequencies >= beta_band[0]) & (frequencies <= beta_band[1])
    )

    theta_power = np.sum(power_density[theta_indices])
    beta_power = np.sum(power_density[beta_indices])

    if beta_power > 0:
        return theta_power / beta_power
    else:
        return None

# --- 3. Main Script to Load and Loop ---
def process_eeg_file(csv_file_stream):
    print("Processing EEG file...")
    try:
        # `read_csv` with `chunk size` returns an iterator
        # `header=None` ensures the first line is treated as data
        chunks = pd.read_csv(io.StringIO(csv_file_stream.read().decode('utf-8')), chunksize=CHUNK_SIZE, header=None)

        for i, chunk in enumerate(chunks):
            # We need to select the correct electrode column from the chunk
            eeg_segment = chunk[ELECTRODE_INDEX].values

            # Process the segment to get the focus score
            focus_score = process_eeg_segment(eeg_segment)

            # Simulate real-time delay
            time.sleep(1)

            # Print the live result
            if focus_score is not None:
                print(f"Second {i + 1}: Focus Score (TBR) = {focus_score:.2f}")
            else:
                print(f"Second {i + 1}: Could not calculate score.")

        print("\nSimulation complete.")
        return {"status": "success", "message": "Simulation complete."}

    except FileNotFoundError:
        print("Error: The file was not found. Please check the file path.")
        return {"status": "error", "message": str(e)}