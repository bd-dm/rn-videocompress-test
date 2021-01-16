import React, {useState} from 'react';
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Pressable,
} from 'react-native';

import {launchImageLibrary} from 'react-native-image-picker';

import {Colors} from 'react-native/Libraries/NewAppScreen';

const App: () => React$Node = () => {
  const [state, setState] = useState({
    video: null,
  });

  const pickVideo = (video) => {
    setState((prevState) => ({
      ...prevState,
      video,
    }));
  };

  const openVideoPicker = () => {
    launchImageLibrary(
      {
        mediaType: 'video',
        durationLimit: 60 * 10,
      },
      ({uri, didCancel}) => !didCancel && pickVideo(uri),
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}
        />
        <Pressable onPress={openVideoPicker}>
          <View style={styles.button}>
            <Text>Pick a video</Text>
          </View>
        </Pressable>

        <Text>Video: {state.video}</Text>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  button: {
    padding: 10,
    backgroundColor: Colors.primary,
  },
});

export default App;
