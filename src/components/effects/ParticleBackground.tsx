"use client";

import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Three.js Canvas:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

export function ParticleBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] bg-transparent">
      <ErrorBoundary>
        <Canvas camera={{ position: [0, 0, 1] }}>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={1} fade speed={1.5} />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
