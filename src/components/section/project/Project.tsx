import { css } from '@acab/ecsstatic';
import { Component } from 'solid-js';
import ProjectInfo from '~/components/section/project/item/ProjectInfo';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent } from '../SectionStyles';

const projectContentStyle = css`
  margin-top: 4px;
  gap: 8px;
`;

const Project: Component = () => {
  return (
    <SectionItem title='project.'>
      <div class={`${sectionContent} ${projectContentStyle}`}>
        <ProjectInfo />
      </div>
    </SectionItem>
  );
};

export default Project;
