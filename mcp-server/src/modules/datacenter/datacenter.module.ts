import { Module } from '@nitrostack/core';
import { DatacenterTools } from './datacenter.tools.js';
import { DatacenterResources } from './datacenter.resources.js';
import { DatacenterPrompts } from './datacenter.prompts.js';

@Module({
  name: 'datacenter',
  description: 'Digital Twin and Infrastructure Resilience capability module',
  controllers: [DatacenterTools, DatacenterResources, DatacenterPrompts]
})
export class DatacenterModule {}
