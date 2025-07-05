
# mms.py
from transformers import AutoTokenizer, VitsModel
import torch
import soundfile as sf
import base64
import io

class MMS:
    def __init__(self, device=None):
        print("Loading MMS TTS model locally...")
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")
        
        self.tokenizer = AutoTokenizer.from_pretrained("facebook/mms-tts-mrw")
        self.model = VitsModel.from_pretrained("facebook/mms-tts-mrw").to(self.device)

        self.sampling_rate = self.model.config.sampling_rate if hasattr(self.model.config, 'sampling_rate') else 16000
        print(f"Model sampling rate detected: {self.sampling_rate} Hz")


    def tts(self, text, src_lang=None): 
        if not text or not text.strip():
            raise ValueError("Input text for TTS is empty.")
        
        try:
           
            inputs = self.tokenizer(text, return_tensors="pt").to(self.device)
            
            with torch.no_grad():
                speech_waveform = self.model(**inputs).waveform[0].cpu().numpy()
                        
            with io.BytesIO() as buffer:
                sf.write(buffer, speech_waveform, samplerate=self.sampling_rate, format='FLAC')
                buffer.seek(0)
                audio_base64 = base64.b64encode(buffer.read()).decode('ascii')

            print("Audio generated and encoded in base64")
            return audio_base64

        except Exception as e:
            print(f"Error during TTS generation: {e}")
            raise # Re-raise the exception for FastAPI to catch