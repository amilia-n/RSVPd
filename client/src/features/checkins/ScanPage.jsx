import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { QrScanner } from "qr-scanner";
import { CheckCircle2, XCircle, Scan, Camera, CameraOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import checkinsApi from "./checkins.api";
import { Spinner } from "@/components/ui/spinner";

export default function ScanPage() {
  const videoRef = useRef(null);
  const [qrScanner, setQrScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [deviceLabel, setDeviceLabel] = useState("");

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (data) => checkinsApi.scan(data),
    onSuccess: (result) => {
      setLastResult({
        success: true,
        message: "Check-in successful!",
        data: result.check_in,
      });
      setManualToken(""); // Clear manual input
      // Resume scanning after 2 seconds
      setTimeout(() => {
        setLastResult(null);
        if (isScanning && qrScanner) {
          qrScanner.start();
        }
      }, 2000);
    },
    onError: (error) => {
      setLastResult({
        success: false,
        message: error.response?.data?.error?.message || "Check-in failed",
      });
      setTimeout(() => setLastResult(null), 3000);
    },
  });

  const handleCheckIn = (qrToken, eventId = null) => {
    if (!qrToken) return;

    checkInMutation.mutate({
      qr_token: qrToken,
      event_id: eventId,
      device_label: deviceLabel || "QR Scanner",
    });
  };

  // Memoize stopScanning to prevent unnecessary re-renders
  const stopScanning = useCallback(() => {
    if (qrScanner) {
      qrScanner.stop();
      qrScanner.destroy();
      setQrScanner(null);
      setIsScanning(false);
    }
  }, [qrScanner]);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (result.data) {
            try {
              const payload = JSON.parse(result.data);
              if (payload.t && payload.e) {
                handleCheckIn(payload.t, payload.e);
                scanner.stop();
              } else {
                handleCheckIn(payload.t || result.data);
                scanner.stop();
              }
            } catch {
              // Not JSON, treat as plain token
              handleCheckIn(result.data);
              scanner.stop();
            }
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await scanner.start();
      setQrScanner(scanner);
      setIsScanning(true);
    } catch (error) {
      console.error("Failed to start scanner:", error);
      alert("Failed to access camera. Please check permissions.");
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Check-In Scanner</h1>
        <p className="text-muted-foreground mt-2">
          Scan QR codes to check in attendees
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle>QR Scanner</CardTitle>
            <CardDescription>
              Use your camera to scan ticket QR codes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
              />
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Scan className="size-16 text-white/50" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startScanning} className="w-full">
                  <Camera className="size-4 mr-2" />
                  Start Scanning
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="destructive" className="w-full">
                  <CameraOff className="size-4 mr-2" />
                  Stop Scanning
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceLabel">Device Label (Optional)</Label>
              <Input
                id="deviceLabel"
                placeholder="Scanner-001"
                value={deviceLabel}
                onChange={(e) => setDeviceLabel(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Manual Entry & Results */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Entry</CardTitle>
            <CardDescription>
              Enter QR token manually if scanning fails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manualToken">QR Token</Label>
              <Input
                id="manualToken"
                placeholder="Enter QR token"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualToken) {
                    handleCheckIn(manualToken);
                  }
                }}
              />
            </div>
            <Button
              onClick={() => handleCheckIn(manualToken)}
              disabled={!manualToken || checkInMutation.isPending}
              className="w-full"
            >
              {checkInMutation.isPending ? (
                <>
                  <Spinner className="mr-2" />
                  Processing...
                </>
              ) : (
                "Check In"
              )}
            </Button>

            {/* Results */}
            {lastResult && (
              <Alert variant={lastResult.success ? "default" : "destructive"}>
                {lastResult.success ? (
                  <CheckCircle2 className="size-4 text-green-600" />
                ) : (
                  <XCircle className="size-4" />
                )}
                <AlertTitle>
                  {lastResult.success ? "Success" : "Error"}
                </AlertTitle>
                <AlertDescription>{lastResult.message}</AlertDescription>
                {lastResult.data && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <strong>Ticket:</strong> {lastResult.data.ticket_id}
                    </p>
                    <p className="text-sm">
                      <strong>Event:</strong> {lastResult.data.event_id}
                    </p>
                    <p className="text-sm">
                      <strong>Scanned at:</strong>{" "}
                      {new Date(lastResult.data.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}