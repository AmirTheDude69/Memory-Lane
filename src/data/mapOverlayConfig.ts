export type MapCameraConfig = {
  location: string;
  zoom: number;
};

export type OverlayCalibration = {
  offsetX: number;
  offsetY: number;
  scaleMultiplier: number;
};

export const HOME_FIXED_CAMERA: MapCameraConfig = {
  location: '20,0',
  zoom: 2,
};

export const HOME_OVERLAY_CALIBRATION: OverlayCalibration = {
  offsetX: 0,
  offsetY: 0,
  scaleMultiplier: 1,
};
