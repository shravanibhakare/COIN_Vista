// src/ml/lstm.js
import * as tf from "@tensorflow/tfjs";

// ----- helpers for scaling -----
function minMaxScale(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const denom = max - min || 1; // avoid divide by zero
  const scaled = arr.map(v => (v - min) / denom);
  return { scaled, min, max, denom };
}
function invertMinMaxScale(value, min, max, denom) {
  return value * denom + min;
}

// ----- dataset builder -----
export function makeWindowedDataset(series, windowSize = 30) {
  const { scaled, min, max, denom } = minMaxScale(series);
  const N = scaled.length - windowSize;

  const xs = new Array(N);
  const ys = new Array(N);

  for (let i = 0; i < N; i++) {
    xs[i] = scaled.slice(i, i + windowSize).map(v => [v]); // [time,1]
    ys[i] = [scaled[i + windowSize]];
  }

  const xsT = tf.tensor3d(xs); // [samples, time, 1]
  const ysT = tf.tensor2d(ys); // [samples, 1]
  return { xsT, ysT, min, max, denom };
}

// ----- model -----
export function buildModel(windowSize = 30) {
  const model = tf.sequential();
  model.add(tf.layers.lstm({ units: 64, inputShape: [windowSize, 1] })); // doubled units
  model.add(tf.layers.dropout({ rate: 0.2 })); // better generalization
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({
    optimizer: tf.train.adam(1e-3),
    loss: "meanSquaredError",
  });
  return model;
}

// ----- train -----
export async function train(model, xsT, ysT, epochs = 20, onEpoch) {
  return model.fit(xsT, ysT, {
    epochs,
    batchSize: 64,       // larger batch for faster GPU training
    shuffle: true,       // better generalization
    validationSplit: 0.1, // small val set
    callbacks: onEpoch ? { onEpochEnd: onEpoch } : undefined,
  });
}

// ----- forecast N steps ahead (recursive) -----
export function forecast(model, series, windowSize, min, max, denom, horizon = 7) {
  const lastWindow = series.slice(-windowSize).map(v => (v - min) / denom);
  let windowArr = Float32Array.from(lastWindow);
  const preds = [];

  for (let i = 0; i < horizon; i++) {
    const input = tf.tensor3d([Array.from(windowArr, v => [v])]); // [1, win, 1]
    const out = model.predict(input);
    const nextScaled = out.dataSync()[0];
    tf.dispose([input, out]);

    preds.push(invertMinMaxScale(nextScaled, min, max, denom));

    // slide window
    windowArr = windowArr.slice(1);
    windowArr = Float32Array.of(...windowArr, nextScaled);
  }

  return preds;
}
