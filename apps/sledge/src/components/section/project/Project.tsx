import { css } from '@acab/ecsstatic';
import { Component } from 'solid-js';
import AutoSave from '~/components/section/project/item/ProjectAutoSave';
import ProjectLocation from '~/components/section/project/item/ProjectLocation';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent } from '../SectionStyles';

const projectContentStyle = css`
  gap: 8px;
`;

const Project: Component = () => {
  return (
    <SectionItem title='project.'>
      <div class={`${sectionContent} ${projectContentStyle}`}>
        <ProjectLocation />

        <AutoSave />
      </div>
    </SectionItem>
  );
};

export default Project;
