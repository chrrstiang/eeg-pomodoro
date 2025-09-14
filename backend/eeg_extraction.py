import pandas as pd
from scipy.signal import welch
import numpy as np
import io


# process eeg csv file and return focus score
def calculate_tbr(csv_file_stream):
    # --- 1. Define Constants for the Analysis ---
    # These are based on the dataset's specifications
    SAMPLING_RATE = 500  # Hz
    ELECTRODE_INDEX = 16  # Index for the Fz electrode
    WINDOW_SIZE = SAMPLING_RATE  # 1-second windows for focus score calculation

    # --- 2. Define Frequency Bands for the Score ---
    # These are the standard frequency ranges for theta and beta waves
    theta_band = (4, 8)  # Hz
    beta_band = (13, 30)  # Hz

    # --- 3. Load the EEG Data ---
    try:
        df = pd.read_csv(io.StringIO(csv_file_stream.read().decode('utf-8')), header=None)
        eeg_data = df[ELECTRODE_INDEX].values
        print(f"Successfully loaded data for electrode at column {ELECTRODE_INDEX}")
    except FileNotFoundError:
        print("Error: The file was not found. Please check the file path.")
        exit()

    # --- 4. Perform the Welch Method ---
    # The Welch method estimates the power spectral density (PSD)
    frequencies, power_density = welch(
        eeg_data,
        fs=SAMPLING_RATE,
        nperseg=WINDOW_SIZE,
        scaling='density'
    )

    # --- 5. Calculate the Power in Each Band ---
    # Find the indices that correspond to the frequency bands
    theta_indices = np.where(
        (frequencies >= theta_band[0]) & (frequencies <= theta_band[1])
    )
    beta_indices = np.where(
        (frequencies >= beta_band[0]) & (frequencies <= beta_band[1])
    )

    # Sum the power in each band
    theta_power = np.sum(power_density[theta_indices])
    beta_power = np.sum(power_density[beta_indices])

    # --- 6. Calculate the Theta/Beta Ratio (TBR) ---
    # Avoid division by zero
    if beta_power > 0:
        tbr = theta_power / beta_power
        print(f"\nCalculated Theta/Beta Ratio (TBR): {tbr:.2f}")
        return tbr
    else:
        print("\nBeta power is zero, cannot calculate TBR.")
        return None