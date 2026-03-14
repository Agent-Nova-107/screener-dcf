"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  ColorType,
  LineStyle,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";
import type { PricePoint, FairValuePoint } from "@/types";

interface Props {
  priceHistory: PricePoint[];
  fairValueHistory?: FairValuePoint[];
}

export function PriceChart({ priceHistory, fairValueHistory }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#131722" },
        textColor: "#9ca3af",
        fontFamily: "monospace",
      },
      grid: {
        vertLines: { color: "#1c2030" },
        horzLines: { color: "#1c2030" },
      },
      width: containerRef.current.clientWidth,
      height: 400,
      crosshair: {
        vertLine: { color: "#3b82f6", width: 1, style: LineStyle.Dashed },
        horzLine: { color: "#3b82f6", width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: "#2a2e3e",
      },
      timeScale: {
        borderColor: "#2a2e3e",
        timeVisible: false,
      },
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    candleSeries.setData(
      priceHistory.map((p) => ({
        time: p.time,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
      }))
    );

    if (fairValueHistory && fairValueHistory.length > 0) {
      const fvSeries = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: "Juste Valeur",
        crosshairMarkerVisible: true,
      });
      fvSeries.setData(
        fairValueHistory.map((p) => ({
          time: p.time,
          value: p.value,
        }))
      );
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [priceHistory, fairValueHistory]);

  return (
    <div className="card overflow-hidden">
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-secondary)" }}
        >
          Cours de Bourse vs Juste Valeur
        </h3>
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5" style={{ background: "#10b981" }} /> Prix
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-0.5 border-t border-dashed"
              style={{ borderColor: "#f59e0b" }}
            />{" "}
            Juste Valeur
          </span>
        </div>
      </div>
      <div ref={containerRef} />
    </div>
  );
}
