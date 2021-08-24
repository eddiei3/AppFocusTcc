import React, { Component, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	Button,
	Share,
	FlatList,
	Clipboard,
	Image,
	TouchableOpacity,
	Modal
} from 'react-native';
import { Camera, Constants } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { nanoid } from 'nanoid/non-secure';
import * as Permissions from 'expo-permissions';
import Environment from './config/environment';
import firebase from './config/firebase';

console.disableYellowBox = true;

async function uploadImageAsync(uri) {
	const blob = await new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.onload = function () {
			resolve(xhr.response);
		};
		xhr.onerror = function (e) {
			console.log(e);
			reject(new TypeError('Network request failed'));
		};
		xhr.responseType = 'blob';
		xhr.open('GET', uri, true);
		xhr.send(null);
	});

	const ref = firebase
		.storage()
		.ref()
		.child(nanoid());
	const snapshot = await ref.put(blob);

	blob.close();

	return await snapshot.ref.getDownloadURL();
}

class App extends Component {
	state = {
		image: null,
		uploading: false,
		googleResponse: null,
		modalVisible: false,
		cameraType: 'back',
		mirrorMode: false
	};


	setModalVisible(visible) {
		this.setState({ modalVisible: visible });
	};

	async componentDidMount() {
		await Permissions.askAsync(Permissions.CAMERA_ROLL);
		await Permissions.askAsync(Permissions.CAMERA);
	}

	organize = array => {
		return array.map(function (item, i) {
			return (
				<View key={i}>
					<Text>{item}</Text>
				</View>
			);
		});
	};

	_maybeRenderUploadingOverlay = () => {
		if (this.state.uploading) {
			return (
				<View
					style={[
						StyleSheet.absoluteFill,
						{
							backgroundColor: 'rgba(255,255,255,0.4)',
							alignItems: 'center',
							justifyContent: 'center'
						}
					]}
				>
					<ActivityIndicator color="#fff" animating size="large" />
				</View>
			);
		}
	};

	_maybeRenderImage = () => {
		let { image, googleResponse } = this.state;
		if (!image) {
			return;
		}

		return (
			<Modal
				animationType="slide"
				transparent={false}
				visible={this.state.modalVisible}
				onRequestClose={() => {
					Alert.alert('Modal has been closed.')
				}}
			>
				<View style={{
					backgroundColor: '#fff',
					width: '100%',
					height: '100%',
					flex: 1,
					elevation: 2,
					alignItems: 'center',
					justifyContent: 'center'
				}}>
					<TouchableOpacity style={[styles.button, { top: 20, right: 5 }]} onPress={() => this.submitToGoogle()}>
						<FontAwesome name="exclamation" size={23} color="#000" />
					</TouchableOpacity>

					<TouchableOpacity style={[styles.button, { top: 20, left: 5 }]} onPress={() => { this.setModalVisible(!this.state.modalVisible) }}>
						<FontAwesome name="window-close" size={23} color="#000" />
					</TouchableOpacity>

					<View
						style={{
							borderTopRightRadius: 3,
							borderTopLeftRadius: 3,
							shadowColor: 'rgba(0,0,0,1)',
							shadowOpacity: 0.2,
							shadowOffset: { width: 4, height: 4 },
							shadowRadius: 5,
							overflow: 'hidden'
						}}
					>

						<Image source={{ uri: image }} style={{ width: 300, height: 300, borderRadius: 10 }} />
						{this.state.googleResponse && (
							<FlatList
								data={this.state.googleResponse.responses[0].labelAnnotations}
								extraData={this.state}
								keyExtractor={this._keyExtractor}
								renderItem={({ item }) => (
									<Text style={styles.logoText}>
										{item.description}
									</Text>
								)}
							/>
						)}
					</View>
					<TouchableOpacity style={[styles.button, { bottom: 20, left: 5 }]} onPress={() => { this.setModalVisible(!this.state.modalVisible) }}>
						<FontAwesome name="window-close" size={23} color="#000" />
					</TouchableOpacity>
					<TouchableOpacity style={[styles.button, { bottom: 20, right: 5 }]} onPress={() => this.submitToGoogle()}>
						<FontAwesome name="audio-description" size={23} color="#000" />
					</TouchableOpacity>
				</View>
			</Modal>
		);
	};

	_keyExtractor = (item, index) => item.description;

	_renderItem = item => {
		<Text>response: {JSON.stringify(item)}</Text>;
	};

	changeCameraType() {
		if (this.state.cameraType === 'back') {
			this.setState({
				cameraType: 'front',
				mirror: true
			});
		} else {
			this.setState({
				cameraType: 'back',
				mirror: false
			});
		}
	}

	_share = () => {
		Share.share({
			message: JSON.stringify(this.state.googleResponse.responses),
			title: 'Check it out',
			url: this.state.image
		});
	};

	_copyToClipboard = () => {
		Clipboard.setString(this.state.image);
		alert('Copied to clipboard');
	};

	_takePhoto = async () => {
		let pickerResult = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
		});

		this._handleImagePicked(pickerResult);
	};

	_pickImage = async () => {
		let pickerResult = await ImagePicker.launchImageLibraryAsync({
			allowsEditing: true,
		});

		this._handleImagePicked(pickerResult);
	};

	_handleImagePicked = async pickerResult => {
		try {
			this.setState({ uploading: true });

			if (!pickerResult.cancelled) {
				uploadUrl = await uploadImageAsync(pickerResult.uri);
				this.setState({ image: uploadUrl });
			}
		} catch (e) {
			console.log(e);
			alert('Upload failed, sorry :(');
		} finally {
			this.setState({ uploading: false });
		}
	};

	submitToGoogle = async () => {
		try {
			this.setState({ uploading: true });
			let { image } = this.state;
			let body = JSON.stringify({
				requests: [
					{
						features: [
							{ type: 'LABEL_DETECTION', maxResults: 5 },
							{ type: 'LANDMARK_DETECTION', maxResults: 5 },
							{ type: 'FACE_DETECTION', maxResults: 5 },
							{ type: 'LOGO_DETECTION', maxResults: 5 },
							{ type: 'TEXT_DETECTION', maxResults: 5 },
							{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 5 },
							{ type: 'SAFE_SEARCH_DETECTION', maxResults: 5 },
							{ type: 'IMAGE_PROPERTIES', maxResults: 5 },
							{ type: 'CROP_HINTS', maxResults: 5 },
							{ type: 'WEB_DETECTION', maxResults: 5 }
						],
						image: {
							source: {
								imageUri: image
							}
						}
					}
				]
			});
			let response = await fetch(
				'https://vision.googleapis.com/v1/images:annotate?key=' +
				Environment['GOOGLE_CLOUD_VISION_API_KEY'],
				{
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json'
					},
					method: 'POST',
					body: body
				}
			);
			let responseJson = await response.json();
			console.log(responseJson);
			this.setState({
				googleResponse: responseJson,
				uploading: false
			});
		} catch (error) {
			console.log(error);
		}
	};

	render() {
		let { image } = this.state;

		return (
			<View style={styles.container}>

				<Camera style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }}
					type={this.state.cameraType}
					mirrorImage={this.state.mirrorMode}>
					{image ? null : (
						<Text style={styles.getStartedText}>Focus</Text>
					)}
					<TouchableOpacity style={[styles.button, { right: 5 }]} onPress={this._takePhoto}>
						<FontAwesome name="camera" size={23} color="#000" />
					</TouchableOpacity>

					<TouchableOpacity style={[styles.button, { left: 5 }]} onPress={this._pickImage}>
						<FontAwesome name="upload" size={23} color="#000" />
					</TouchableOpacity>

					<TouchableOpacity style={[styles.button, { left: 100 }]} onPress={() => { this.setModalVisible(true) }}>
						<FontAwesome name="window-maximize" size={23} color="#000" />
					</TouchableOpacity>

					<TouchableOpacity style={[styles.button, { right: 100 }]} onPress={this.changeCameraType.bind(this)}>
						<FontAwesome name="refresh" size={23} color="#000" />
					</TouchableOpacity>
				</Camera>

				{this._maybeRenderImage()}
				{this._maybeRenderUploadingOverlay()}

			</View>
		);
	}
}

export default App;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ebebeb',
	},
	developmentModeText: {
		marginBottom: 20,
		color: 'rgba(0,0,0,0.4)',
		fontSize: 14,
		lineHeight: 19,
		textAlign: 'center'
	},
	contentContainer: {
		paddingTop: 30
	},

	getStartedContainer: {
		alignItems: 'center',
		marginHorizontal: 50,
		marginVertical: 50
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
	getStartedText: {
		fontSize: 24,
		color: '#000',
		fontWeight: 'bold',
		textAlign: 'center'
	},

	helpContainer: {
		marginTop: 15,
		alignItems: 'center'
	},

	logoText: {
		fontSize: 20,
		fontWeight: '600'
	}
});