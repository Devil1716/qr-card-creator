import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';
import logger from './logger';

const GITHUB_REPO = 'devil1716/qr-card-creator';
const CURRENT_VERSION = Constants.expoConfig?.version || '1.0.0';

/**
 * Checks for the latest release on GitHub and prompts the user to update if available.
 */
/**
 * Checks for the latest release on GitHub.
 */
export const checkForUpdates = async () => {
    if (Platform.OS === 'web') return null;

    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);

        if (!response.ok) {
            if (response.status === 403) {
                logger.warn('GitHub API rate limit exceeded');
                return null;
            }
            throw new Error(`GitHub API returned ${response.status}`);
        }

        const data = await response.json();
        const latestVersion = data.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present

        if (isNewerVersion(CURRENT_VERSION, latestVersion)) {
            const downloadUrl = getApkDownloadUrl(data.assets);

            if (downloadUrl) {
                return {
                    version: latestVersion,
                    releaseNotes: data.body,
                    downloadUrl: downloadUrl
                };
            }
        }
    } catch (error) {
        logger.error('Failed to check for updates:', error);
    }
    return null;
};

/**
 * Compares two semantic version strings.
 * Returns true if available > current.
 */
const isNewerVersion = (current, available) => {
    const v1 = current.split('.').map(Number);
    const v2 = available.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
        const num1 = v1[i] || 0;
        const num2 = v2[i] || 0;

        if (num2 > num1) return true;
        if (num2 < num1) return false;
    }
    return false;
};

/**
 * Finds the APK download URL from the release assets.
 */
const getApkDownloadUrl = (assets) => {
    if (!assets) return null;
    // Look for .apk file
    const apkAsset = assets.find(asset => asset.name.endsWith('.apk'));
    return apkAsset ? apkAsset.browser_download_url : null;
};


