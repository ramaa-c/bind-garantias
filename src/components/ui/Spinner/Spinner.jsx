import React from "react";

export default function Spinner({
  size = 48,
  center = false,
  color = "#f5f400"
}) {
  return (
    <div style={center ? styles.center : undefined}>
      <svg
        viewBox="0 0 48 68"
        className="bind-spinner"
        style={{
          width: size,
          height: size,
          color: color,
          display: "block"
        }}
      >
        <style>
          {`
          .petal polygon{
            fill:currentColor;
            opacity:.2;
            animation:petalFade 1s linear infinite;
            filter: drop-shadow(0 0 4px currentColor);
          }

          .p1 polygon{animation-delay:0s;}
          .p2 polygon{animation-delay:.15s;}
          .p3 polygon{animation-delay:.30s;}
          .p4 polygon{animation-delay:.45s;}
          .p5 polygon{animation-delay:.60s;}
          .p6 polygon{animation-delay:.75s;}
          .p7 polygon{animation-delay:.90s;}
          .p8 polygon{animation-delay:1.05s;}

          @keyframes petalFade{
            0%{opacity:.2}
            50%{opacity:1}
            100%{opacity:.2}
          }

          @keyframes glowPulse{
            0%{filter: drop-shadow(0 0 3px currentColor);}
            50%{filter: drop-shadow(0 0 8px currentColor);}
            100%{filter: drop-shadow(0 0 3px currentColor);}
          }

          .bind-spinner{
            animation: glowPulse 2s ease-in-out infinite;
          }
          `}
        </style>

        <g className="petal p1">
          <polygon points="24.188 28.618 18.833 19.216 24.188 9.814 29.54 19.216 24.188 28.618"/>
        </g>
        <g className="petal p2">
          <polygon points="29.569 33.999 38.97 28.644 48.373 33.999 38.97 39.352 29.569 33.999"/>
        </g>
        <g className="petal p3">
          <polygon points="27.992 37.803 38.424 40.666 41.286 51.101 30.853 48.239 27.992 37.803"/>
        </g>
        <g className="petal p4">
          <polygon points="24.188 39.382 29.54 48.784 24.188 58.186 18.833 48.784 24.188 39.382"/>
        </g>
        <g className="petal p5">
          <polygon points="20.381 37.803 17.521 48.239 7.083 51.101 9.945 40.666 20.381 37.803"/>
        </g>
        <g className="petal p6">
          <polygon points="18.805 33.999 9.401 39.352 0 33.999 9.401 28.644 18.805 33.999"/>
        </g>
        <g className="petal p7">
          <polygon points="20.381 30.193 9.945 27.331 7.083 16.899 17.521 19.76 20.381 30.193"/>
        </g>
        <g className="petal p8">
          <polygon points="27.992 30.193 30.853 19.76 41.286 16.899 38.424 27.331 27.992 30.193"/>
        </g>
      </svg>
    </div>
  );
}

const styles = {
  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }
};