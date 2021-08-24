import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Camera } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker';

function Api(){
  return (
    <View>
        <Text>
            Teste
        </Text>
    </View>
   );
}

function HomeScreen({ navigation }) {
  const CamRef = useRef(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [hasPermission, setHasPermission] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [open, setOpen] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [image, setImage] = useState(null);

  useEffect(() => {
      (async () => {
        const {status} = await Camera.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      })();

      (async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
  }, []);

  if(hasPermission === null){
    return <View/>;
  }

  if(hasPermission === false){
    return <Text>Permissão negada!</Text>;
  }

  async function takePicture(){
    if(CamRef){
      const data = await CamRef.current.takePictureAsync();
      setCapturedPhoto(data.uri);
      setOpen(true);
      console.log(data);
    }
  }

  async function pickImage(){
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    console.log(result);
    setImage(result.uri);
    setAberto(true);

    if (!result.cancelled) {
      setImage(result.uri);
      setAberto(true);
    }
  };

  return (
      <SafeAreaView style={styles.container}>
    
      <Camera 
      style={{ flex: 1 }}
      type={type}
      ref={CamRef}
      >
      <View style={{flex: 1, backgroundColor: 'transparent', flexDirection:'row'}}>
      
      <TouchableOpacity  style={[styles.button, { top: 30, left: 5 }]} onPress={() => navigation.navigate('Api')}>
        <FontAwesome name="folder-open" size={25} color='#000' />
      </TouchableOpacity>
        
        <TouchableOpacity 
        style={[styles.button, { right: 150 }]}
        onPress={() => {
          setType(
            type === Camera.Constants.Type.back
            ? Camera.Constants.Type.front
            : Camera.Constants.Type.back
          )
        }}
        >
          <FontAwesome name="refresh" size={23} color="#000"/>
        </TouchableOpacity>
      </View>
      </Camera>

      <TouchableOpacity style={[styles.button, { right:5 }]} onPress={ takePicture }>
          <FontAwesome name="camera" size={23} color="#000"/>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, { left: 5 }]} onPress={ pickImage }>
          <FontAwesome name="upload" size={23} color="#000"/>
      </TouchableOpacity>

      { capturedPhoto &&
        <Modal animationType="slide"
        transparent={true}
        style={{flex: 1}}
        visible={open}
        >

        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}> 
          <Image style={{ width: '100%', height: '100%', borderRadius: 20, position:'absolute'}} source={{uri: capturedPhoto}}/>
        </View>

        <TouchableOpacity style={[styles.button, { right:5 }]}  onPress={ () => setOpen(false)}>
            <FontAwesome name="close" size={23} color="#000"/>
        </TouchableOpacity>

        </Modal>
      }

      { image &&
        <Modal animationType="slide"
        transparent={true}
        style={{flex: 1}}
        visible={aberto}
        >

        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}> 
          <Image style={{ width: '100%', height: '100%', borderRadius: 20, position:'absolute'}} source={{uri: image}}/>
        </View>

        <TouchableOpacity style={[styles.button, { right:5 }]}  onPress={ () => setAberto(false)}>
            <FontAwesome name="close" size={23} color="#000"/>
        </TouchableOpacity>

        </Modal>
      }
      </SafeAreaView>
  );
}

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>

        <Stack.Screen name="home" component={HomeScreen} 
        options={{
        headerTransparent: true,
        title: '', }}/>

        <Stack.Screen name="Api" component={Api}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    width: 50,
    bottom: 5,
    position: "absolute",
    height: 50,
    borderRadius: 50,
  },
});
