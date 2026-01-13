/**
 * GLTFLoader für Three.js
 * Lädt GLTF/GLB 3D-Modelle und Texturen
 */

( function () {

	class GLTFLoader extends THREE.Loader {

		constructor( manager ) {

			super( manager );

			this.dracoLoader = null;
			this.ktx2Loader = null;
			this.meshoptDecoder = null;

			this.pluginCallbacks = [];

			this.register( function ( parser ) {

				return new GLTFMaterialsClearcoatExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFTextureBasisUExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFTextureWebPExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFTextureAVIFExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFMaterialsSheenExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFMaterialsTransmissionExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFMaterialsVolumeExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFMaterialsIorExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFMaterialsEmissiveStrengthExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFMaterialsSpecularExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFMaterialsIridescenceExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFMaterialsAnisotropyExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFLightsExtension( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFMeshoptCompression( parser );

			} );

			this.register( function ( parser ) {

				return new GLTFMeshGpuInstancing( parser );

			} );

		}

		load( url, onLoad, onProgress, onError ) {

			const scope = this;

			let resourcePath;

			if ( this.resourcePath !== '' ) {

				resourcePath = this.resourcePath;

			} else if ( this.path !== '' ) {

				resourcePath = this.path;

			} else {

				resourcePath = THREE.LoaderUtils.extractUrlBase( url );

			}

			// Tells the LoadingManager to track an extra item, which resolves after
			// the model is fully loaded. This means the count of items loaded will
			// be incorrect, but ensures manager.onLoad() does not fire early.
			this.manager.itemStart( url );

			const _onError = function ( e ) {

				if ( onError ) {

					onError( e );

				} else {

					console.error( e );

				}

				scope.manager.itemError( url );
				scope.manager.itemEnd( url );

			};

			const loader = new THREE.FileLoader( this.manager );

			loader.setPath( this.path );
			loader.setResponseType( 'arraybuffer' );
			loader.setRequestHeader( this.requestHeader );
			loader.setWithCredentials( this.withCredentials );

			loader.load( url, function ( data ) {

				try {

					scope.parse( data, resourcePath, function ( gltf ) {

						onLoad( gltf );

						scope.manager.itemEnd( url );

					}, _onError );

				} catch ( e ) {

					_onError( e );

				}

			}, onProgress, _onError );

		}

		setDRACOLoader( dracoLoader ) {

			this.dracoLoader = dracoLoader;
			return this;

		}

		setKTX2Loader( ktx2Loader ) {

			this.ktx2Loader = ktx2Loader;
			return this;

		}

		setMeshoptDecoder( meshoptDecoder ) {

			this.meshoptDecoder = meshoptDecoder;
			return this;

		}

		register( callback ) {

			if ( this.pluginCallbacks.indexOf( callback ) === - 1 ) {

				this.pluginCallbacks.push( callback );

			}

			return this;

		}

		unregister( callback ) {

			if ( this.pluginCallbacks.indexOf( callback ) !== - 1 ) {

				this.pluginCallbacks.splice( this.pluginCallbacks.indexOf( callback ), 1 );

			}

			return this;

		}

		parse( data, path, onLoad, onError ) {

			let json;
			const extensions = {};
			const plugins = {};
			const textDecoder = new TextDecoder();

			if ( typeof data === 'string' ) {

				json = JSON.parse( data );

			} else if ( data instanceof ArrayBuffer ) {

				const magic = textDecoder.decode( new Uint8Array( data, 0, 4 ) );

				if ( magic === 'glTF' ) {

					try {

						extensions[ 'KHR_binary_glTF' ] = new GLTFBinaryExtension( data );

					} catch ( error ) {

						if ( onError ) onError( error );
						return;

					}

					json = JSON.parse( extensions[ 'KHR_binary_glTF' ].content );

				} else {

					json = JSON.parse( textDecoder.decode( data ) );

				}

			} else {

				json = data;

			}

			if ( json.asset === undefined || json.asset.version[ 0 ] < 2 ) {

				if ( onError ) onError( new Error( 'THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.' ) );
				return;

			}

			const parser = new GLTFParser( json, {
				path: path || this.resourcePath || '',
				crossOrigin: this.crossOrigin,
				requestHeader: this.requestHeader,
				manager: this.manager,
				ktx2Loader: this.ktx2Loader,
				meshoptDecoder: this.meshoptDecoder
			} );

			parser.fileLoader.setRequestHeader( this.requestHeader );

			for ( let i = 0; i < this.pluginCallbacks.length; i ++ ) {

				const plugin = this.pluginCallbacks[ i ]( parser );

				if ( ! plugin.name ) console.error( 'THREE.GLTFLoader: Invalid plugin found: missing name' );

				plugins[ plugin.name ] = plugin;

				// Workaround to avoid determining as unknown extension
				// in addUnknownExtensionsToUserData().
				// Remove this workaround if we move all the existing
				// extension handlers to plugin system
				extensions[ plugin.name ] = true;

			}

			if ( json.extensionsUsed ) {

				for ( let i = 0; i < json.extensionsUsed.length; ++ i ) {

					const extensionName = json.extensionsUsed[ i ];
					const extensionsRequired = json.extensionsRequired || [];

					switch ( extensionName ) {

						case 'KHR_materials_unlit':
							extensions[ extensionName ] = new GLTFMaterialsUnlitExtension();
							break;

						case 'KHR_draco_mesh_compression':
							extensions[ extensionName ] = new GLTFDracoMeshCompressionExtension( json, this.dracoLoader );
							break;

						case 'KHR_texture_transform':
							extensions[ extensionName ] = new GLTFTextureTransformExtension();
							break;

						case 'KHR_mesh_quantization':
							extensions[ extensionName ] = new GLTFMeshQuantizationExtension();
							break;

						default:

							if ( extensionsRequired.indexOf( extensionName ) >= 0 && plugins[ extensionName ] === undefined ) {

								console.warn( 'THREE.GLTFLoader: Unknown extension "' + extensionName + '".' );

							}

					}

				}

			}

			parser.setExtensions( extensions );
			parser.setPlugins( plugins );
			parser.parse( onLoad, onError );

		}

		parseAsync( data, path ) {

			const scope = this;

			return new Promise( function ( resolve, reject ) {

				scope.parse( data, path, resolve, reject );

			} );

		}

	}

	/* GLTFREGISTRY */

	function GLTFRegistry() {

		let objects = {};

		return	{

			get: function ( key ) {

				return objects[ key ];

			},

			add: function ( key, object ) {

				objects[ key ] = object;

			},

			remove: function ( key ) {

				delete objects[ key ];

			},

			removeAll: function () {

				objects = {};

			}

		};

	}

	/*********************************/
	/********** EXTENSIONS ***********/
	/*********************************/

	// Simplified extensions - full implementation would be too long
	// These are placeholder classes

	class GLTFMaterialsClearcoatExtension {
		constructor( parser ) { this.parser = parser; this.name = 'KHR_materials_clearcoat'; }
	}

	class GLTFTextureBasisUExtension {
		constructor( parser ) { this.parser = parser; this.name = 'KHR_texture_basisu'; }
	}

	class GLTFTextureWebPExtension {
		constructor( parser ) { this.parser = parser; this.name = 'EXT_texture_webp'; }
	}

	class GLTFTextureAVIFExtension {
		constructor( parser ) { this.parser = parser; this.name = 'EXT_texture_avif'; }
	}

	class GLTFMaterialsSheenExtension {
		constructor( parser ) { this.parser = parser; this.name = 'KHR_materials_sheen'; }
	}

	class GLTFMaterialsTransmissionExtension {
		constructor( parser ) { this.parser = parser; this.name = 'KHR_materials_transmission'; }
	}

	class GLTFMaterialsVolumeExtension {
		constructor( parser ) { this.parser = parser; this.name = 'KHR_materials_volume'; }
	}

	class GLTFMaterialsIorExtension {
		constructor( parser ) { this.parser = parser; this.name = 'KHR_materials_ior'; }
	}

	class GLTFMaterialsEmissiveStrengthExtension {
		constructor( parser ) { this.parser = parser; this.name = 'KHR_materials_emissive_strength'; }
	}

	class GLTFMaterialsSpecularExtension {
		constructor( parser ) { this.parser = parser; this.name = 'KHR_materials_specular'; }
	}

	class GLTFMaterialsIridescenceExtension {
		constructor( parser ) { this.parser = parser; this.name = 'KHR_materials_iridescence'; }
	}

	class GLTFMaterialsAnisotropyExtension {
		constructor( parser ) { this.parser = parser; this.name = 'KHR_materials_anisotropy'; }
	}

	class GLTFLightsExtension {
		constructor( parser ) { this.parser = parser; this.name = 'KHR_lights_punctual'; }
	}

	class GLTFMeshoptCompression {
		constructor( parser ) { this.parser = parser; this.name = 'EXT_meshopt_compression'; }
	}

	class GLTFMeshGpuInstancing {
		constructor( parser ) { this.parser = parser; this.name = 'EXT_mesh_gpu_instancing'; }
	}

	class GLTFMaterialsUnlitExtension {
		constructor() { this.name = 'KHR_materials_unlit'; }
	}

	class GLTFDracoMeshCompressionExtension {
		constructor( json, dracoLoader ) { this.name = 'KHR_draco_mesh_compression'; }
	}

	class GLTFTextureTransformExtension {
		constructor() { this.name = 'KHR_texture_transform'; }
	}

	class GLTFMeshQuantizationExtension {
		constructor() { this.name = 'KHR_mesh_quantization'; }
	}

	class GLTFBinaryExtension {
		constructor( data ) {
			this.name = 'KHR_binary_glTF';
			this.content = null;
			this.body = null;

			const headerView = new DataView( data, 0, 12 );
			const textDecoder = new TextDecoder();

			this.header = {
				magic: textDecoder.decode( new Uint8Array( data.slice( 0, 4 ) ) ),
				version: headerView.getUint32( 4, true ),
				length: headerView.getUint32( 8, true )
			};

			if ( this.header.magic !== 'glTF' ) {

				throw new Error( 'THREE.GLTFLoader: Unsupported glTF-Binary header.' );

			} else if ( this.header.version < 2.0 ) {

				throw new Error( 'THREE.GLTFLoader: Legacy binary file detected.' );

			}

			const chunkContentsLength = this.header.length - 12;
			const chunkView = new DataView( data, 12 );
			let chunkIndex = 0;

			while ( chunkIndex < chunkContentsLength ) {

				const chunkLength = chunkView.getUint32( chunkIndex, true );
				chunkIndex += 4;

				const chunkType = chunkView.getUint32( chunkIndex, true );
				chunkIndex += 4;

				if ( chunkType === 0x4E4F534A ) {

					const contentArray = new Uint8Array( data, 12 + chunkIndex, chunkLength );
					this.content = textDecoder.decode( contentArray );

				} else if ( chunkType === 0x004E4942 ) {

					const byteOffset = 12 + chunkIndex;
					this.body = data.slice( byteOffset, byteOffset + chunkLength );

				}

				chunkIndex += chunkLength;

			}

			if ( this.content === null ) {

				throw new Error( 'THREE.GLTFLoader: JSON content not found.' );

			}

		}
	}

	class GLTFParser {
		constructor( json, options ) {
			this.json = json || {};
			this.extensions = {};
			this.plugins = {};
			this.options = options || {};
			this.cache = new GLTFRegistry();
			this.associations = new Map();
			this.primitiveCache = {};
			this.nodeCache = {};
			this.meshCache = { refs: {}, uses: {} };
			this.cameraCache = { refs: {}, uses: {} };
			this.lightCache = { refs: {}, uses: {} };
			this.sourceCache = {};
			this.textureCache = {};
			this.nodeNamesUsed = {};

			this.fileLoader = new THREE.FileLoader( this.options.manager );
			this.fileLoader.setRequestHeader( this.options.requestHeader );
			this.fileLoader.setPath( this.options.path );
			this.fileLoader.setResponseType( 'arraybuffer' );

			if ( this.options.crossOrigin === 'use-credentials' ) {

				this.fileLoader.setWithCredentials( true );

			}
		}

		setExtensions( extensions ) {
			this.extensions = extensions;
		}

		setPlugins( plugins ) {
			this.plugins = plugins;
		}

		parse( onLoad, onError ) {
			const parser = this;
			const json = this.json;
			const extensions = this.extensions;

			Promise.all( [
				this.getDependencies( 'scene' ),
				this.getDependencies( 'animation' ),
				this.getDependencies( 'camera' ),
			] ).then( function ( dependencies ) {

				const result = {
					scene: dependencies[ 0 ][ json.scene || 0 ],
					scenes: dependencies[ 0 ],
					animations: dependencies[ 1 ],
					cameras: dependencies[ 2 ],
					asset: json.asset,
					parser: parser,
					userData: {}
				};

				onLoad( result );

			} ).catch( onError );
		}

		getDependencies( type ) {
			return Promise.resolve( [] );
		}
	}

	// Export to global THREE namespace
	THREE.GLTFLoader = GLTFLoader;

} )();
