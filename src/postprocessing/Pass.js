( function () {

	class Pass {

		constructor() {

			this.isPass = true;

			// if set to true, the pass is processed by the composer
			this.enabled = true;

			// if set to true, the pass indicates to swap read and write buffer after rendering
			this.needsSwap = true;

			// if set to true, the pass clears its buffer before rendering
			this.clear = false;

			// if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.
			this.renderToScreen = false;

		}

		setSize( /* width, height */ ) {}

		render( /* renderer, writeBuffer, readBuffer, deltaTime, maskActive */ ) {

			console.error( 'THREE.Pass: .render() must be implemented in derived pass.' );

		}

		dispose() {}

	}

	// Helper for passes that need to fill the viewport with a single quad.

	const _camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );

	// https://github.com/mrdoob/three.js/pull/21358

	class FullScreenQuad {

		constructor( material ) {

			this._mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), null );
			this._mesh.frustumCulled = false;
			this.material = material;

		}

		dispose() {

			this._mesh.geometry.dispose();

		}

		render( renderer ) {

			renderer.render( this._mesh, _camera );

		}

		get material() {

			return this._mesh.material;

		}

		set material( value ) {

			this._mesh.material = value;

		}

	}

	THREE.FullScreenQuad = FullScreenQuad;
	THREE.Pass = Pass;

} )();
