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
		googleResponse: null
	};


	type = {
		cameraType: 'back',
		mirrorMode: false
	}


	modal = {
		openModal: false
	}

	onClickButton = e => {
		e.preventDefault()
		this.setState({ openModal: true })
	}

	onCloseModal = () => {
		this.setState({ openModal: false })
	}

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
			<View
				style={{
					flex: 1,
					backgroundColor: "#fff",
					position: "absolute",
					width: "100%",
					height: "100%",
					alignItems: "center",
					justifyContent: "center"
				}}>
				<Image source={{ uri: image }} style={{ width: "70%", height: "70%" }} />
				<TouchableOpacity style={[styles.button, { bottom: 20 }]} onPress={() => this.submitToGoogle()}>
					<FontAwesome name="exclamation" size={23} color="#000" />
				</TouchableOpacity>
			</View>
		);
	};

	_keyExtractor = (item, index) => item.description;

	_renderItem = item => {
		<Text>response: {JSON.stringify(item)}</Text>;
	};

	_changeCameraType = () => {
		if (this.type.cameraType === 'back') {
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
	};

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
							//{ type: 'LABEL_DETECTION', maxResults: 10 },
							//{ type: 'LANDMARK_DETECTION', maxResults: 5 },
							//{ type: 'FACE_DETECTION', maxResults: 5 },
							//{ type: 'LOGO_DETECTION', maxResults: 5 },
							{ type: 'TEXT_DETECTION', maxResults: 1 },
							//{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 5 },
							//{ type: 'SAFE_SEARCH_DETECTION', maxResults: 5 },
							//{ type: 'IMAGE_PROPERTIES', maxResults: 5 },
							//{ type: 'CROP_HINTS', maxResults: 5 },
							//{ type: 'WEB_DETECTION', maxResults: 5 }
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
				<ScrollView contentContainerStyle={styles.contentContainer}>
					<Camera style={{ width: 400, height: 400 }}
						type={this.type.cameraType}
						mirrorImage={this.type.mirrorMode}>
						{image ? null : (
							<Text style={styles.getStartedText}>Focus</Text>
						)}
						<View style={{ flex: 1, backgroundColor: 'transparent', flexDirection: 'row' }}>

							<TouchableOpacity style={[styles.button, { right: 5 }]} onPress={this._takePhoto}>
								<FontAwesome name="camera" size={23} color="#000" />
							</TouchableOpacity>

							<TouchableOpacity style={[styles.button, { left: 5 }]} onPress={this._pickImage}>
								<FontAwesome name="upload" size={23} color="#000" />
							</TouchableOpacity>

							{/* <TouchableOpacity style={[styles.button, { right: 150 }]} onPress={this._changeCameraType.bind(this)}>
								<FontAwesome name="refresh" size={23} color="#000" />
								</TouchableOpacity> */}

							<TouchableOpacity style={[styles.button, { right: 150 }]} onPress={this.onClickButton}>
								<FontAwesome name="refresh" size={23} color="#000" />
							</TouchableOpacity>
						
						<View
								animationType="slide"
								transparent={false}
								style={{ position: 'relative'}}
								open={this.modal.openModal}
								onClose={this.onCloseModal}
							>
								<View style={{ justifyContent: 'center', alignItems: 'center' }}>
									<Image source={{ uri: 'https://hbomax-images.warnermediacdn.com/images/GXbGBEw3y6pGYoAEAAAVc/tileburnedin?size=1280x720&partner=hbomaxcom&language=pt-br&host=art-gallery-latam.api.hbo.com&w=1280' }} style={{ width: 40, height: 40 }} />
								</View>
							</View>
						</View>

						{this.state.googleResponse && (
							<FlatList
								data={this.state.googleResponse.responses[0].textAnnotations}
								extraData={this.state}
								keyExtractor={this._keyExtractor}
								renderItem={({ item }) => (
									<Text style={styles.logoText}>
										{item.description}
									</Text>
								)}
							/>
						)}

						{this._maybeRenderImage()}
						{this._maybeRenderUploadingOverlay()}
					</Camera>
				</ScrollView>
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
	contentContainer: {
		flex: 1,
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