import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {Amplify, Storage} from 'aws-amplify';
import aws_exports from './src/aws-exports';

Amplify.configure(aws_exports);

const App = () => {
  const [filePath, setFilePath] = useState({});
  const [uri, setUri] = useState(null);
  const [fileName, setFileName] = useState(null);

  const chooseFile = type => {
    let options = {
      mediaType: type,
      maxWidth: 300,
      maxHeight: 550,
      quality: 1,
    };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        alert('User cancelled camera picker');
        return;
      } else if (response.errorCode == 'camera_unavailable') {
        alert('Camera not available on device');
        return;
      } else if (response.errorCode == 'permission') {
        alert('Permission not satisfied');
        return;
      } else if (response.errorCode == 'others') {
        alert(response.errorMessage);
        return;
      }
      setUri(response.assets[0].uri);
      setFileName(response.assets[0].fileName);
      setFilePath(response);
    });
  };

  async function uploadVideo() {
    try {
      const photo = await fetch(uri);
      const photoBlob = await photo.blob();
      await Storage.put(uri, photoBlob, {
        level: 'public',
        contentType: 'image/jpg',
      }).then(response => {
        alert('File uploaded successfully');
        console.log(response, 'response');
      });
    } catch (err) {
      console.log('error:', err);
      alert(err);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.buttonStyle}
        onPress={() => chooseFile('video')}>
        <Text style={styles.textStyle}>Click here for video</Text>
      </TouchableOpacity>
      {uri !== null && fileName !== null && (
        <>
          <Text style={styles.fileName}>{fileName}</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => uploadVideo()}>
            <Text style={styles.textStyle}>Upload Video</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonStyle: {
    alignItems: 'center',
    backgroundColor: '#5791b3',
    padding: 5,
    marginVertical: 10,
    width: 250,
    borderRadius: 6,
  },
  textStyle: {
    padding: 10,
    color: 'black',
    textAlign: 'center',
    fontSize: 15,
  },
  uploadButton: {
    alignItems: 'center',
    backgroundColor: '#ee4d1d',
    padding: 5,
    marginVertical: 10,
    width: 250,
    borderRadius: 6,
  },
  fileName: {
    padding: 10,
    color: 'black',
    textAlign: 'center',
    fontSize: 20,
  },
});

export default App;
