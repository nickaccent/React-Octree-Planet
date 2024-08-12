export class Chunk {
  constructor(
    planet,
    children,
    parent,
    position,
    radius,
    detailLevel,
    localUp,
    axisA,
    axisB,
    terrainFace,
  ) {
    this.planet = planet;
    this.children = children;
    this.parent = parent;
    this.position = position;
    this.radius = radius;
    this.detailLevel = detailLevel;
    this.localUp = localUp;
    this.axisA = axisA;
    this.axisB = axisB;
    this.terrainFace = terrainFace;
    this.vertices = [];
    this.triangles = [];
  }

  GenerateChildren() {
    const maxDetail = 8;
    if (this.detailLevel <= maxDetail && this.detailLevel >= 0) {
      if (
        this.position
          .clone()
          .normalize()
          .multiplyScalar(this.planet.size)
          .distanceTo(this.planet.player.position) <=
        this.planet.detailLevelDistances[this.detailLevel]
      ) {
        this.children = [];

        let pos = this.position
          .clone()
          .add(this.axisA.clone().multiplyScalar(this.radius).divideScalar(2))
          .add(this.axisB.clone().multiplyScalar(this.radius).divideScalar(2));
        this.children.push(
          new Chunk(
            this.planet,
            [],
            this,
            pos,
            this.radius / 2,
            this.detailLevel + 1,
            this.localUp,
            this.axisA,
            this.axisB,
            this.terrainFace,
          ),
        );
        pos = this.position
          .clone()
          .add(this.axisA.clone().multiplyScalar(this.radius).divideScalar(2))
          .sub(this.axisB.clone().multiplyScalar(this.radius).divideScalar(2));
        this.children.push(
          new Chunk(
            this.planet,
            [],
            this,
            pos,
            this.radius / 2,
            this.detailLevel + 1,
            this.localUp,
            this.axisA,
            this.axisB,
            this.terrainFace,
          ),
        );
        pos = this.position
          .clone()
          .sub(this.axisA.clone().multiplyScalar(this.radius).divideScalar(2))
          .add(this.axisB.clone().multiplyScalar(this.radius).divideScalar(2));
        this.children.push(
          new Chunk(
            this.planet,
            [],
            this,
            pos,
            this.radius / 2,
            this.detailLevel + 1,
            this.localUp,
            this.axisA,
            this.axisB,
            this.terrainFace,
          ),
        );
        pos = this.position
          .clone()
          .sub(this.axisA.clone().multiplyScalar(this.radius).divideScalar(2))
          .sub(this.axisB.clone().multiplyScalar(this.radius).divideScalar(2));
        this.children.push(
          new Chunk(
            this.planet,
            [],
            this,
            pos,
            this.radius / 2,
            this.detailLevel + 1,
            this.localUp,
            this.axisA,
            this.axisB,
            this.terrainFace,
          ),
        );

        for (const child of this.children) {
          child.GenerateChildren();
        }
      }
    }
  }

  UpdateChunk(playerPosition) {
    if (!playerPosition) return;
    this.planet.player.position = playerPosition;
    const lod = this.planet.detailLevelDistances[this.detailLevel];
    const distanceToPlayer = this.terrainFace
      .localToWorld(this.position.clone().normalize().multiplyScalar(this.planet.size))
      .distanceTo(this.planet.player.position);
    this.planet.distanceToPlayer = distanceToPlayer;
    // console.log(distanceToPlayer);

    if (this.detailLevel <= 8) {
      if (distanceToPlayer > lod) {
        this.children = [];
      } else {
        if (this.children.length > 0) {
          for (const child of this.children) {
            child.UpdateChunk(playerPosition);
          }
        } else {
          this.GenerateChildren();
        }
      }
    }
  }

  GetVisibleChildren() {
    let toBeRendered = [];
    if (this.children && this.children.length > 0) {
      for (const child of this.children) {
        toBeRendered = toBeRendered.concat(child.GetVisibleChildren());
      }
    } else {
      // let pDist = Math.pow(this.planet.size, 2) + Math.pow(this.planet.distanceToPlayer, 2);

      // let aDist = Math.pow(
      //   this.terrainFace
      //     .localToWorld(this.position.clone().normalize().multiplyScalar(this.planet.size))
      //     .distanceTo(this.planet.player.position),
      //   2,
      // );
      // let cDist = pDist - aDist;
      // let planetDist = 2 * this.planet.size * this.planet.distanceToPlayer;
      // let distance = Math.acos(cDist / planetDist);
      // if (distance < this.planet.cullingMinAngle) {
      //   console.log(
      //     `pdist: ${pDist}, adist: ${aDist}, cDist: ${cDist}, planetDist: ${planetDist}, distance: ${distance}`,
      //   );
      // }
      // if (!isNaN(distance) && distance < this.planet.cullingMinAngle) {
      toBeRendered.push(this);
      // }
    }
    return toBeRendered;
  }
}
