import { Injectable } from '@nestjs/common';
import { Island } from 'citysupplier-common/model/world';
import { NoiseService } from '../noise/noise.service';
import { configuration } from '../../config/config';
import { Land } from '../../model/world/Land';
import { Water } from '../../model/world/Water';
import { range2D } from '../../utils/range2D';
import { Coordinate } from 'citysupplier-common/model/global';

@Injectable()
export class IslandGenerationService {
	private worldPosition: Coordinate;

	constructor(private noiseService: NoiseService) {
	}

	public generateIsland(worldX: number, worldY: number): Island {
		const { floor, sin, cos } = Math;
		const size = configuration.ISLAND_SIZE;
		const middle = size / 2;
		const radius = floor(middle * configuration.ISLAND_FILL_RATIO);
		const island: Island = { entities: [] };

		this.worldPosition = { x: worldX, y: worldY };

		range2D(
			0, size,
			(x, y) => island.entities[x].push(new Water({ x, y })),
			() => island.entities.push([]),
		);


		for (let angle = 0; angle < 2 * Math.PI * radius; angle += 0.01) {
			const noise = this.noiseService.generate2DNoise(worldX * size + sin(angle), worldY * size + cos(angle));
			const R = radius + noise * configuration.COAST_VARIATION;
			const x = floor(R * cos(angle) + middle);
			const y = floor(R * sin(angle) + middle);
			island.entities[x][y] = new Land({ x, y }, this.getFertility(x, y));
		}

		this.floodFill(island, middle, middle);

		return island;
	}

	private getFertility(x: number, y: number): number {
		return 1 - this.noiseService.generate2DNoise(
			this.worldPosition.x * configuration.ISLAND_SIZE + x * 0.1,
			this.worldPosition.x * configuration.ISLAND_SIZE + y * 0.1
		) * 1.1;
	}

	private floodFill(island: Island, x: number, y: number): void {
		const { entities } = island;
		if (x < 0 || x >= configuration.ISLAND_SIZE || y < 0 || y >= configuration.ISLAND_SIZE) return;
		if (entities[x][y] instanceof Land) return;
		entities[x][y] = new Land({ x, y }, this.getFertility(x, y));
		this.floodFill(island, x + 1, y);
		this.floodFill(island, x - 1, y);
		this.floodFill(island, x, y + 1);
		this.floodFill(island, x, y - 1);
	}
}
