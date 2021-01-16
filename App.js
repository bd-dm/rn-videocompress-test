import React, {useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Pressable,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import CameraRoll from '@react-native-community/cameraroll';
import {RNFFprobe, RNFFmpeg} from 'react-native-ffmpeg';
import RNFS from 'react-native-fs';

import {launchImageLibrary} from 'react-native-image-picker';

import {Colors} from 'react-native/Libraries/NewAppScreen';

const getFilePathByUri = async (uri) => {
  let destPath = uri;

  if (uri.startsWith('content://')) {
    const uriComponents = uri.split('/');
    const fileNameAndExtension = uriComponents[uriComponents.length - 1];
    destPath = `${RNFS.TemporaryDirectoryPath}/${fileNameAndExtension}`;
    await RNFS.copyFile(uri, destPath);
  }
  return destPath;
};

const hasAndroidPermission = async () => {
  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

  const hasPermission = await PermissionsAndroid.check(permission);
  if (hasPermission) {
    return true;
  }

  const status = await PermissionsAndroid.request(permission);
  return status === 'granted';
};

const hasCamerarollPermission = async () => {
  return !(Platform.OS === 'android' && !(await hasAndroidPermission()));
};

const Button = (props) => {
  const {onPress, children} = props;

  return (
    <Pressable onPress={onPress}>
      <View style={styles.button}>
        <Text>{children}</Text>
      </View>
    </Pressable>
  );
};

const App = () => {
  const [state, setState] = useState({
    videoUri: null,
    thumbnailUri: null,
    convertedVideo: null,
    isLoading: false,
    log: ['Log started'],
  });

  const log = (line: string) => {
    setState((prevState) => ({
      ...prevState,
      log: [...prevState.log, line],
    }));
  };

  const setIsLoading = (isLoading) => {
    setState((prevState) => ({
      ...prevState,
      isLoading,
    }));
  };

  const setVideoThumbnail = (uri) => {
    setState((prevState) => ({
      ...prevState,
      thumbnailUri: uri,
    }));
  };

  const setConvertedVideo = (uri) => {
    setState((prevState) => ({
      ...prevState,
      convertedVideo: uri,
    }));
  };

  const saveToCameraroll = async (filePath) => {
    if (!(await hasCamerarollPermission())) {
      return;
    }

    const saveResult = await CameraRoll.save(filePath);
    log(`Cameraroll save result: ${saveResult}`);
  };

  const convertVideo = () => async () => {
    setIsLoading(true);

    const resultPath = `${RNFS.CachesDirectoryPath}/video.mp4`;
    log(`convertVideo resultPath: ${resultPath}`);

    const result = await RNFFmpeg.execute(
      `-y -i ${state.videoUri} -r 30 -vf scale=-2:720 -c:v libx264 -c:a aac -crf 15 -preset veryslow ${resultPath}`,
    );
    log(`convertVideo result: ${result}`);

    if (result === 0) {
      await saveToCameraroll(resultPath);
      setConvertedVideo(resultPath);
    }
    setIsLoading(false);
  };

  const getVideoFrame = (n) => async () => {
    const resultPath = `${RNFS.CachesDirectoryPath}/thumbnail.png`;
    log(`getVideoFrame resultPath: ${resultPath}`);

    const result = await RNFFmpeg.execute(
      `-y -i ${state.videoUri} -vf "select=eq(n\\,${n})" -vframes 1 ${resultPath}`,
    );
    log(`getVideoFrame result: ${result}`);

    if (result === 0) {
      setVideoThumbnail(resultPath);
    }
  };

  const getVideoInfo = () => async () => {
    const result = await RNFFprobe.getMediaInformation(state.videoUri);
    const info = result.getMediaProperties();
    log('Video info:');
    Object.entries(info).forEach(([key, value]) => {
      log(
        `\t ${key}: ${
          typeof value === 'string' ? value : JSON.stringify(value)
        }`,
      );
    });
  };

  const pickVideo = (videoUri) => {
    setState((prevState) => ({
      ...prevState,
      videoUri,
    }));
    log(`Video uri: ${videoUri}`);
  };

  const openVideoPicker = () => {
    launchImageLibrary(
      {
        mediaType: 'video',
        durationLimit: 60 * 10,
      },
      async ({uri, didCancel, errorMessage}) => {
        if (didCancel) {
          return;
        }

        if (!uri) {
          log('Uri is empty :( ' + errorMessage);
        }

        const filePath = await getFilePathByUri(uri);
        return !didCancel && pickVideo(decodeURIComponent(filePath));
      },
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        {state.isLoading && (
          <ActivityIndicator size="small" color={Colors.primary} />
        )}
        <Button onPress={openVideoPicker}>Pick a video</Button>
        {state.videoUri && (
          <>
            <Button onPress={getVideoFrame(500)}>Show 500th frame</Button>
            <Button onPress={getVideoInfo()}>Get video info</Button>
            <Button onPress={convertVideo()}>Convert video to 720p</Button>
          </>
        )}
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}>
        {state.thumbnailUri && (
          <Image
            source={{
              uri: 'file://' + state.thumbnailUri,
            }}
            style={styles.thumbnail}
          />
        )}
        {state.convertedVideo && <Text>{state.convertedVideo}</Text>}

        <View style={styles.log}>
          {state.log.map((el, idx) => (
            <Text key={idx} style={styles.logLine}>
              # {el}
            </Text>
          ))}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
  },
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  button: {
    padding: 10,
    backgroundColor: Colors.primary,
  },
  log: {
    backgroundColor: Colors.lighter,
    paddingTop: 5,
  },
  logLine: {
    marginBottom: 5,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
});

export default App;
