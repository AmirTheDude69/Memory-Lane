import { jsx as _jsx } from 'react/jsx-runtime';
import { addPropertyControls, ControlType, motion } from 'framer';

const containerStyles = {
  width: '100%',
  height: '100%',
};

const borderRadiusControl = {
  borderRadius: {
    title: 'Radius',
    type: ControlType.Number,
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
    displayStepper: true,
  },
};

const useRadius = (props) => {
  if (!props.isMixedBorderRadius) return props.borderRadius ?? 0;

  const topLeft = props.topLeftRadius ?? props.borderRadius ?? 0;
  const topRight = props.topRightRadius ?? props.borderRadius ?? 0;
  const bottomRight = props.bottomRightRadius ?? props.borderRadius ?? 0;
  const bottomLeft = props.bottomLeftRadius ?? props.borderRadius ?? 0;

  return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
};

/**
 * GOOGLE MAPS
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function GoogleMaps({ coordinates, zoom, style, ...props }) {
  const borderRadius = useRadius(props);

  return /*#__PURE__*/ _jsx(motion.div, {
    ...props,
    style: {
      ...style,
      ...containerStyles,
      overflow: 'hidden',
      borderRadius,
    },
    children: /*#__PURE__*/ _jsx('iframe', {
      style: { height: '100%', width: '100%', border: 0 },
      src: `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&z=${zoom}&output=embed`,
    }),
  });
}

addPropertyControls(GoogleMaps, {
  coordinates: {
    type: ControlType.String,
    title: 'Location',
    placeholder: 'Framer B.V.',
    defaultValue: 'Framer B.V.',
    description: 'The name of the place or its GPS coordinates.',
  },
  zoom: {
    type: ControlType.Number,
    step: 1,
    min: 0,
    max: 25,
    title: 'Zoom',
    defaultValue: 15,
  },
  ...borderRadiusControl,
});
