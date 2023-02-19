import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View, Platform} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {Amplify, Storage} from 'aws-amplify';
import aws_exports from './src/aws-exports';
import {StorageChunkUpload} from 'amplify-s3-chunk-upload';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';

Amplify.configure(aws_exports);
const storagePlugin = new StorageChunkUpload({});
Storage.addPluggable(storagePlugin);
storagePlugin.configure(aws_exports);

const App = () => {
  const [file, setFile] = useState({});
  const [uri, setUri] = useState(null);
  const [fileName, setFileName] = useState(null);

  const chooseFile = type => {
    let options = {
      mediaType: type,
      maxWidth: 300,
      maxHeight: 550,
      quality: 1,
      includeBase64: true,
    };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        alert('User cancelled camera picker');
        return;
      } else if (response.errorCode === 'camera_unavailable') {
        alert('Camera not available on device');
        return;
      } else if (response.errorCode === 'permission') {
        alert('Permission not satisfied');
        return;
      } else if (response.errorCode === 'others') {
        alert(response.errorMessage);
        return;
      }
      setUri(response.assets[0].uri);
      setFileName(response.assets[0].fileName);
      setFile(response);
    });
  };

  async function uploadVideo() {
    try {
      if (Platform.OS === 'android' && file.assets[0].fileSize / 1048576 > 50) {
        // file.assets[0].fileSize >
        const {size} = await RNFS.stat(uri);

        // here we are simulating an array of bytes
        const fileObject = {
          // set the size
          size: size,

          // here we will read file as per bodyStart & bodyEnd, this will avoid reading complete file in the memory.
          slice: (bodyStart, bodyEnd) => {
            // Here in this sample code, we are using react-native-fs to read files.
            return RNFS.read(uri, bodyEnd - bodyStart, bodyStart, 'base64')
              .then(data => {
                Buffer.from(data, 'base64');
              })
              .catch(error => {
                console.log('error from android:', error);
                alert(error);
              });
          },
        };
        // Upload call, for parameters, refer to Amplify docs.
        await Storage.put(uri, fileObject, {
          contentType: 'video/mp4',
          level: 'public',
          provider: 'StorageChunkUpload',
        })
          .then(response => {
            alert('File uploaded successfully');
            console.log(response, 'response');
          })
          .catch(error => {
            console.log('error:', error);
          });
      } else {
        const photo = await fetch(uri);
        const photoBlob = await photo.blob();
        await Storage.put(uri, photoBlob, {
          level: 'public',
          contentType: 'video/mp4',
        })
          .then(response => {
            alert('File uploaded successfully');
            console.log(response, 'response');
          })
          .catch(error => {
            console.log('error2:', error);
          });
      }
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
