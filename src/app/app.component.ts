import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as three from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('canvas', { static: true, read: ElementRef })
  public canvas: ElementRef;

  private textureLoader = new three.TextureLoader;

  private scene: three.Scene;
  private camera: three.Camera;
  private renderer: three.WebGLRenderer;

  private ghost1: three.PointLight;
  private ghost2: three.PointLight;
  private ghost3: three.PointLight;

  private orbitCtrl: OrbitControls;

  private clock: three.Clock;

  private houseGroup = new three.Group();
  private gravesGroup = new three.Group();

  private sizes = {
    height: window.innerHeight,
    width: window.innerWidth,
  }

  private get aspectRatio(): number {
    return this.sizes.width / this.sizes.height;
  }

  private tick = () => {
    const elapsedTime = this.clock.getElapsedTime();

    const ghost1Angle = elapsedTime * 0.5;
    this.ghost1.position.set(
      Math.sin(ghost1Angle) * 4,
      Math.sin(elapsedTime * 0.3),
      Math.cos(ghost1Angle) * 4,
    )

    const ghost2Angle = elapsedTime * -0.32;
    this.ghost2.position.set
      (Math.sin(ghost2Angle) * 5,
      Math.sin(elapsedTime * 0.4) + Math.sin(elapsedTime * 2.5),
      Math.cos(ghost2Angle) * 5,
    )

    const ghost3Angle = elapsedTime * -0.18;
    this.ghost3.position.set(
      Math.cos(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.32)),
      Math.sin(elapsedTime * 4) * Math.sin(elapsedTime * 2.5),
      Math.sin(ghost3Angle) * (7 + Math.sin(elapsedTime * 2.5)),
    )

    this.renderer.render(this.scene, this.camera);
    this.orbitCtrl.update();

    window.requestAnimationFrame(this.tick);
  }

  public ngOnInit() {
    this.createCamera();
    this.createScene();
    this.createRenderer();
    
    this.createLight();
    this.createHouse();
    this.createBushes();
    this.generateGraves();
    this.createGhosts();

    this.scene.fog = new three.Fog(0x262937, 6, 20);

    this.orbitCtrl = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitCtrl.enableDamping = true;

    this.clock = new three.Clock();
    this.tick();
  }

  private createRenderer(): void {
    this.renderer = new three.WebGLRenderer({ canvas: this.canvas.nativeElement });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x262937);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = three.PCFSoftShadowMap;
  }

  private createScene(): void {
    this.scene = new three.Scene();
    this.scene.add(this.camera, this.createPlane());
  }

  private createCamera(): void {
    this.camera = new three.PerspectiveCamera(55, this.aspectRatio, 0.1, 100);

    this.camera.position.z = 8;
    this.camera.position.y = 3;
    this.camera.position.x = 2;
  }

  private createLight(): void {
    const ambientLight = new three.AmbientLight(0xb9d5ff, 0.12);
    
    const directionalLight = new three.DirectionalLight(0xb9d5ff, 0.12);
    directionalLight.position.set(4, 5, -2);
    directionalLight.castShadow = true;

    const doorLight = new three.PointLight(0xff7346, 1, 7);
    doorLight.position.set(0, 2.2, 2.7);
    doorLight.castShadow = true;

    this.optimizeShadow(doorLight.shadow)

    this.houseGroup.add(doorLight);

    this.scene.add(ambientLight, directionalLight);
  }

  private createPlane(): three.Mesh {
    const grassTextures = {
      color: this.textureLoader.load('./assets/textures/grass/color.jpg'),
      normal: this.textureLoader.load('./assets/textures/grass/normal.jpg'),
      ambientOcclusion: this.textureLoader.load('./assets/textures/grass/ambientOcclusion.jpg'),
      roughness: this.textureLoader.load('./assets/textures/grass/roughness.jpg'),
    };

    grassTextures.color.repeat.set(8, 8);
    grassTextures.normal.repeat.set(8, 8);
    grassTextures.ambientOcclusion.repeat.set(8, 8);
    grassTextures.roughness.repeat.set(8, 8);

    grassTextures.color.wrapS = three.RepeatWrapping;
    grassTextures.normal.wrapS = three.RepeatWrapping;
    grassTextures.ambientOcclusion.wrapS = three.RepeatWrapping;
    grassTextures.roughness.wrapS = three.RepeatWrapping;

    grassTextures.color.wrapT = three.RepeatWrapping;
    grassTextures.normal.wrapT = three.RepeatWrapping;
    grassTextures.ambientOcclusion.wrapT = three.RepeatWrapping;
    grassTextures.roughness.wrapT = three.RepeatWrapping;

    const plane = new three.Mesh(
      new three.PlaneBufferGeometry(25, 25, 32, 32),
      new three.MeshStandardMaterial({
        map: grassTextures.color,
        normalMap: grassTextures.normal,
        aoMap: grassTextures.ambientOcclusion,
        roughnessMap: grassTextures.roughness,
      }),
    );

    plane.receiveShadow = true;
    plane.geometry.setAttribute('uv2', new three.Float32BufferAttribute(plane.geometry.getAttribute('uv').array, 2));
    plane.rotateX(Math.PI * -0.5);

    return plane;
  }


  private createHouse(): void {
    this.scene.add(this.houseGroup);

    this.houseGroup.add(
      this.createWalls(),
      this.createRoof(),
      this.createDoor(),
    );
  }

  private createWalls(): three.Mesh {
    const bricksTextures = {
      color: this.textureLoader.load('./assets/textures/bricks/color.jpg'),
      normal: this.textureLoader.load('./assets/textures/bricks/normal.jpg'),
      ambientOcclusion: this.textureLoader.load('./assets/textures/bricks/ambientOcclusion.jpg'),
      roughness: this.textureLoader.load('./assets/textures/bricks/roughness.jpg'),
    };

    const walls = new three.Mesh(
      new three.BoxBufferGeometry(4, 2.5, 4, 32, 32),
      new three.MeshStandardMaterial({
        map: bricksTextures.color,
        normalMap: bricksTextures.normal,
        aoMap: bricksTextures.ambientOcclusion,
        roughnessMap: bricksTextures.roughness,
      }),
    );

    walls.castShadow = true;

    walls.geometry.setAttribute('uv2', new three.Float32BufferAttribute(walls.geometry.getAttribute('uv').array, 2));
    walls.position.y = 2.5 / 2;

    walls.geometry.center();

    return walls;
  }

  private createRoof(): three.Mesh {
    const roof = new three.Mesh(
      new three.ConeBufferGeometry(3.5, 1, 4),
      new three.MeshStandardMaterial({ color: 0xb35f45 }),
    );

    roof.position.y = 2.5 + 1 / 2;
    roof.rotateY(Math.PI / 4);

    return roof;
  }

  private createDoor(): three.Mesh {
    const doorTextures = {
      color: this.textureLoader.load('./assets/textures/door/color.jpg'),
      alpha: this.textureLoader.load('./assets/textures/door/alpha.jpg'),
      ambientOcclusion: this.textureLoader.load('./assets/textures/door/ambientOcclusion.jpg'),
      height: this.textureLoader.load('./assets/textures/door/height.jpg'),
      normal: this.textureLoader.load('./assets/textures/door/normal.jpg'),
      metalness: this.textureLoader.load('./assets/textures/door/metalness.jpg'),
      roughness: this.textureLoader.load('./assets/textures/door/roughness.jpg'),
    };

    const door = new three.Mesh(
      new three.PlaneBufferGeometry(2.2, 2.2, 100, 100),
      new three.MeshStandardMaterial({
        map: doorTextures.color,
        transparent: true,
        alphaMap: doorTextures.alpha,
        aoMap: doorTextures.ambientOcclusion,
        displacementMap: doorTextures.height,
        displacementScale: 0.1,
        normalMap: doorTextures.normal,
        roughnessMap: doorTextures.roughness,
        metalnessMap: doorTextures.metalness,
      }),
    );

    door.geometry.setAttribute('uv2', new three.Float32BufferAttribute(door.geometry.getAttribute('uv').array, 2));
    door.position.y = 1;
    door.position.z = 2 + 0.01;

    return door;
  }

  private createBushes(): void {
    const grassTextures = {
      color: this.textureLoader.load('./assets/textures/grass/color.jpg'),
      normal: this.textureLoader.load('./assets/textures/grass/normal.jpg'),
      ambientOcclusion: this.textureLoader.load('./assets/textures/grass/ambientOcclusion.jpg'),
      roughness: this.textureLoader.load('./assets/textures/grass/roughness.jpg'),
    };

    const bushGeometry = new three.SphereBufferGeometry(1, 16, 16);
    const bushMaterial = new three.MeshStandardMaterial({
      map: grassTextures.color,
      normalMap: grassTextures.normal,
      aoMap: grassTextures.ambientOcclusion,
      roughnessMap: grassTextures.roughness,
    });

    const bushesDataset = [
      { position: [0.8, 0.2, 2.2],  scale: [0.5, 0.5, 0.5] },
      { position: [1.4, 0.1, 2.1],  scale: [0.3, 0.3, 0.3] },
      { position: [-0.8, 0.1, 2.2],  scale: [0.4, 0.4, 0.4] },
      { position: [-1, 0.05, 2.6],  scale: [0.15, 0.15, 0.15] },
    ];

    bushesDataset.forEach(({ scale, position }) => {
      const bush = new three.Mesh(bushGeometry, bushMaterial);
      bush.scale.set(scale[0], scale[1], scale[2]);
      bush.position.set(position[0], position[1], position[2]);

      bush.castShadow = true;
      bush.geometry.setAttribute('uv2', new three.Float32BufferAttribute(bush.geometry.getAttribute('uv').array, 2));
      this.scene.add(bush);
    });
  }

  private generateGraves(): void {
    this.scene.add(this.gravesGroup);

    const graveGeometry = new three.BoxBufferGeometry(0.6, 0.8, 0.2);
    const graveMaterial = new three.MeshStandardMaterial({ color: 0xb2b6b1 });

    for (let i = 0; i <= 25; i++) {
      const grave = new three.Mesh(graveGeometry, graveMaterial);
      const angle = Math.random() * Math.PI * 2;
      const radius = 4 + Math.random() * 6;
      const rotation = (Math.random() - 0.5) * 0.4;

      grave.castShadow = true;
      grave.rotateY(rotation);
      grave.rotateZ(rotation);
      grave.position.set(Math.sin(angle) * radius, 0.3, Math.cos(angle) * radius);
      this.gravesGroup.add(grave);
    }
  }

  private createGhosts(): void {
    this.ghost1 = new three.PointLight(0xff0000, 2, 3);
    this.ghost1.castShadow = true;
    
    this.ghost2 = new three.PointLight(0x00ff00, 2, 3);
    this.ghost2.castShadow = true;
    
    this.ghost3 = new three.PointLight(0x0000ff, 2, 3);
    this.ghost3.castShadow = true;

    this.optimizeShadow(this.ghost1.shadow);
    this.optimizeShadow(this.ghost2.shadow);
    this.optimizeShadow(this.ghost3.shadow);

    this.scene.add(this.ghost1, this.ghost2, this.ghost3);
  }

  private optimizeShadow(shadow: three.PointLightShadow) {
    shadow.mapSize.width = 256;
    shadow.mapSize.height = 256;
    shadow.camera.far = 7;
  }
}
