try:
    import tensorflow as tf
    from tensorflow.keras import layers, models, regularizers
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    tf = None


def build_lstm_model(input_shape: tuple, units: int = 128):
    if not TF_AVAILABLE:
        raise RuntimeError("TensorFlow not available in this environment.")
    model = models.Sequential([
        layers.Input(shape=input_shape),
        layers.LSTM(units, return_sequences=True, kernel_regularizer=regularizers.l2(1e-4)),
        layers.Dropout(0.3),
        layers.LSTM(units // 2, return_sequences=False),
        layers.Dropout(0.3),
        layers.Dense(64, activation="relu"),
        layers.Dense(1, activation="sigmoid"),
    ])
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
                  loss="binary_crossentropy",
                  metrics=["accuracy"])
    return model


def build_gru_model(input_shape: tuple, units: int = 128):
    if not TF_AVAILABLE:
        raise RuntimeError("TensorFlow not available in this environment.")
    model = models.Sequential([
        layers.Input(shape=input_shape),
        layers.GRU(units, return_sequences=True),
        layers.Dropout(0.3),
        layers.GRU(units // 2),
        layers.Dropout(0.3),
        layers.Dense(64, activation="relu"),
        layers.Dense(1, activation="sigmoid"),
    ])
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
                  loss="binary_crossentropy",
                  metrics=["accuracy"])
    return model


def build_cnn_pattern_model(input_shape: tuple, num_classes: int = 6):
    if not TF_AVAILABLE:
        raise RuntimeError("TensorFlow not available in this environment.")
    model = models.Sequential([
        layers.Input(shape=input_shape),
        layers.Conv1D(64, kernel_size=3, activation="relu", padding="same"),
        layers.BatchNormalization(),
        layers.Conv1D(128, kernel_size=3, activation="relu", padding="same"),
        layers.GlobalAveragePooling1D(),
        layers.Dense(64, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation="softmax"),
    ])
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
                  loss="sparse_categorical_crossentropy",
                  metrics=["accuracy"])
    return model
