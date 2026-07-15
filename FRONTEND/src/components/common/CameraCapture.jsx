import { useEffect, useMemo, useRef, useState } from "react";
import Alert from "../ui/Alert";
import Button from "../ui/Button";

function CameraCapture({ photos, onChange }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const previews = useMemo(
    () => photos.map((photo) => ({
      file: photo,
      url: URL.createObjectURL(photo),
    })),
    [photos]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!cameraOpen || !video || !streamRef.current) {
      return;
    }

    video.srcObject = streamRef.current;

    const playVideo = async () => {
      try {
        await video.play();
        setCameraReady(true);
      } catch {
        setError("La camera est autorisee, mais la video n'a pas demarre. Appuie sur Fermer puis reessaie.");
      }
    };

    playVideo();
  }, [cameraOpen]);

  const openCamera = async () => {
    setError("");
    setOpening(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Ce navigateur ne permet pas l'ouverture directe de la camera.");
      setOpening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);
    } catch (err) {
      const permissionDenied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
      const notFound = err?.name === "NotFoundError" || err?.name === "OverconstrainedError";

      if (permissionDenied) {
        setError("Permission camera refusee. Autorise la camera dans les reglages du navigateur puis reessaie.");
      } else if (notFound) {
        setError("Aucune camera compatible n'a ete trouvee sur cet appareil.");
      } else {
        setError("Impossible d'ouvrir la camera. Ferme les autres apps qui utilisent la camera puis reessaie.");
      }
    } finally {
      setOpening(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;

    if (!video || !cameraReady || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("La camera n'est pas encore prete. Attends l'image puis reessaie.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      const file = new File([blob], `vehicle-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      onChange([...photos, file]);
    }, "image/jpeg", 0.9);
  };

  const handleGalleryChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    onChange([...photos, ...selectedFiles]);
    event.target.value = "";
  };

  const removePhoto = (indexToRemove) => {
    onChange(photos.filter((_, index) => index !== indexToRemove));
  };

  const clearPhotos = () => {
    onChange([]);
  };

  return (
    <div className="camera-capture">
      <Alert message={error} />

      {!cameraOpen ? (
        <>
          <Button type="button" variant="outline-primary" className="w-100" onClick={openCamera} disabled={opening}>
            <i className="fa-solid fa-camera me-2" />
            {opening ? "Ouverture..." : "Ouvrir la camera"}
          </Button>
          <label className="gallery-upload-button">
            <i className="fa-solid fa-images me-2" />
            Ajouter depuis la galerie
            <input type="file" accept="image/*" multiple onChange={handleGalleryChange} />
          </label>
        </>
      ) : (
        <div className="camera-panel">
          <video ref={videoRef} playsInline muted autoPlay />
          {!cameraReady && (
            <span className="muted-text">Demarrage de la camera...</span>
          )}
          <div className="camera-actions">
            <Button type="button" onClick={capturePhoto} disabled={!cameraReady}>
              <i className="fa-solid fa-camera me-2" />
              Prendre photo
            </Button>
            <Button type="button" variant="outline-secondary" onClick={stopCamera}>
              Fermer
            </Button>
          </div>
          <label className="gallery-upload-button">
            <i className="fa-solid fa-images me-2" />
            Ajouter depuis la galerie
            <input type="file" accept="image/*" multiple onChange={handleGalleryChange} />
          </label>
        </div>
      )}

      {photos.length > 0 && (
        <div className="captured-photos">
          <div className="captured-header">
            <strong>{photos.length} photo(s)</strong>
            <button type="button" onClick={clearPhotos}>Tout enlever</button>
          </div>
          <div className="captured-grid">
            {previews.map((preview, index) => (
              <div className="captured-thumb" key={`${preview.file.name}-${preview.file.lastModified}-${index}`}>
                <img src={preview.url} alt={`Capture ${index + 1}`} />
                <button type="button" onClick={() => removePhoto(index)} aria-label="Enlever la photo">
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CameraCapture;
