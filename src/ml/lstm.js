import * as tf from "@tensorflow/tfjs";

// ----- helpers for scaling -----
function minMaxScale(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const denom = max - min || 1;
  const scaled = arr.map((v) => (v - min) / denom);
  return { scaled, min, max, denom };
}

function invertMinMaxScale(value, min, max, denom) {
  return value * denom + min;
}

// ----- dataset builder -----
function makeWindowedDataset(series, windowSize = 30, horizon = 1) {
  const { scaled, min, max, denom } = minMaxScale(series);
  const N = scaled.length - windowSize - horizon + 1;

  const xs = [];
  const ys = [];

  for (let i = 0; i < N; i++) {
    xs.push(scaled.slice(i, i + windowSize).map((v) => [v]));
    ys.push([scaled[i + windowSize + horizon - 1]]);
  }

  const xsT = tf.tensor3d(xs);
  const ysT = tf.tensor2d(ys);

  return { xsT, ysT, min, max, denom };
}

// ----- LSTM model -----
function buildModel(windowSize = 30, horizon = 1) {
  const model = tf.sequential();
  model.add(
    tf.layers.lstm({
      units: 128,
      returnSequences: true,
      inputShape: [windowSize, 1],
    })
  );
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.lstm({ units: 64 }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dense({ units: horizon }));

  model.compile({
    optimizer: tf.train.adam(1e-3),
    loss: "meanSquaredError",
  });
  return model;
}

// ----- training -----
async function train(model, xsT, ysT, epochs = 50, onEpoch) {
  return model.fit(xsT, ysT, {
    epochs,
    batchSize: 32,
    shuffle: true,
    validationSplit: 0.1,
    callbacks: onEpoch
      ? {
          onEpochEnd: async (epoch, logs) => {
            onEpoch(epoch, logs);
          },
        }
      : undefined,
  });
}

// ----- forecast -----
function forecast(model, series, windowSize, min, max, denom, horizon = 7) {
  let lastWindow = series.slice(-windowSize).map((v) => (v - min) / denom);
  let windowArr = Float32Array.from(lastWindow);
  const preds = [];

  for (let i = 0; i < horizon; i++) {
    const input = tf.tensor3d([Array.from(windowArr, (v) => [v])]);
    const out = model.predict(input);
    const nextScaled = out.dataSync()[0];
    tf.dispose([input, out]);

    const nextPrice = invertMinMaxScale(nextScaled, min, max, denom);
    preds.push(nextPrice);

    // Slide window
    windowArr = windowArr.slice(1);
    windowArr = Float32Array.of(...windowArr, nextScaled);
  }

  return preds;
}

// ----- named exports -----
export { makeWindowedDataset, buildModel, train, forecast };
