/**
 * Kalman Filter for Location Sensor Fusion
 * Fuses GPS, accelerometer, and gyroscope data for improved accuracy
 */

class KalmanFilter {
    constructor() {
        // State vector: [lat, lon, velocity_n, velocity_e]
        this.state = [0, 0, 0, 0];

        // State covariance matrix (uncertainty)
        this.P = [
            [1000, 0, 0, 0],
            [0, 1000, 0, 0],
            [0, 0, 100, 0],
            [0, 0, 0, 100]
        ];

        // Process noise
        this.Q = [
            [0.1, 0, 0, 0],
            [0, 0.1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];

        // Measurement noise (GPS)
        this.R_gps = [
            [25, 0],  // ~5m std dev
            [0, 25]
        ];

        this.lastUpdate = null;
    }

    /**
     * Predict step using IMU data
     * @param {number} dt - Time delta in seconds
     * @param {Object} imu - {acc_x, acc_y, heading}
     */
    predict(dt, imu = null) {
        if (dt <= 0) return;

        // State transition matrix
        const F = [
            [1, 0, dt, 0],
            [0, 1, 0, dt],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];

        // Predict state
        const prevState = [...this.state];
        this.state[0] = prevState[0] + prevState[2] * dt;
        this.state[1] = prevState[1] + prevState[3] * dt;

        // Update velocity from IMU if available
        if (imu) {
            const heading = imu.heading || 0;
            const acc = Math.sqrt(imu.acc_x ** 2 + imu.acc_y ** 2);
            this.state[2] += acc * Math.cos(heading) * dt;
            this.state[3] += acc * Math.sin(heading) * dt;
        }

        // Update covariance: P = F * P * F' + Q
        this.P = this._addMatrix(
            this._multiplyMatrix(this._multiplyMatrix(F, this.P), this._transpose(F)),
            this.Q
        );
    }

    /**
     * Update step with GPS measurement
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {number} accuracy - GPS accuracy in meters
     */
    updateGPS(lat, lon, accuracy = 10) {
        // Measurement matrix (we measure position only)
        const H = [
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ];

        // Adjust measurement noise based on reported accuracy
        const R = [
            [accuracy ** 2, 0],
            [0, accuracy ** 2]
        ];

        // Measurement residual
        const z = [lat, lon];
        const y = [z[0] - this.state[0], z[1] - this.state[1]];

        // Kalman gain: K = P * H' * (H * P * H' + R)^-1
        const PHt = this._multiplyMatrix(this.P, this._transpose(H));
        const S = this._addMatrix(
            this._multiplyMatrix(H, PHt),
            R
        );
        const K = this._multiplyMatrix(PHt, this._inverse2x2(S));

        // Update state
        this.state[0] += K[0][0] * y[0] + K[0][1] * y[1];
        this.state[1] += K[1][0] * y[0] + K[1][1] * y[1];
        this.state[2] += K[2][0] * y[0] + K[2][1] * y[1];
        this.state[3] += K[3][0] * y[0] + K[3][1] * y[1];

        // Update covariance: P = (I - K * H) * P
        const I_KH = this._subtractMatrix(this._identity(4), this._multiplyMatrix(K, H));
        this.P = this._multiplyMatrix(I_KH, this.P);

        this.lastUpdate = Date.now();
    }

    /**
     * Get current estimated position with confidence
     * @returns {{lat: number, lon: number, accuracy: number, velocity: number}}
     */
    getEstimate() {
        // Accuracy is sqrt of position variance (95% confidence = 1.96 * std)
        const accuracy = Math.sqrt(this.P[0][0] + this.P[1][1]) * 1.96;
        const velocity = Math.sqrt(this.state[2] ** 2 + this.state[3] ** 2);

        return {
            lat: this.state[0],
            lon: this.state[1],
            accuracy: accuracy,
            velocity: velocity,
            lastUpdate: this.lastUpdate
        };
    }

    /**
     * Reset filter with initial position
     */
    reset(lat, lon) {
        this.state = [lat, lon, 0, 0];
        this.P = [
            [100, 0, 0, 0],
            [0, 100, 0, 0],
            [0, 0, 10, 0],
            [0, 0, 0, 10]
        ];
        this.lastUpdate = Date.now();
    }

    // Matrix utility functions
    _multiplyMatrix(A, B) {
        const rowsA = A.length, colsA = A[0].length;
        const rowsB = B.length, colsB = B[0].length;
        const result = Array(rowsA).fill().map(() => Array(colsB).fill(0));

        for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsB; j++) {
                for (let k = 0; k < colsA; k++) {
                    result[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        return result;
    }

    _addMatrix(A, B) {
        return A.map((row, i) => row.map((val, j) => val + B[i][j]));
    }

    _subtractMatrix(A, B) {
        return A.map((row, i) => row.map((val, j) => val - B[i][j]));
    }

    _transpose(A) {
        return A[0].map((_, i) => A.map(row => row[i]));
    }

    _identity(n) {
        return Array(n).fill().map((_, i) =>
            Array(n).fill().map((_, j) => i === j ? 1 : 0)
        );
    }

    _inverse2x2(M) {
        const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
        if (Math.abs(det) < 1e-10) return [[1, 0], [0, 1]]; // Fallback
        return [
            [M[1][1] / det, -M[0][1] / det],
            [-M[1][0] / det, M[0][0] / det]
        ];
    }
}

export default KalmanFilter;
