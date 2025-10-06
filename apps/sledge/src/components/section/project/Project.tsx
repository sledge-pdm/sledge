import { Component } from 'solid-js';
import ProjectLocation from '~/components/section/project/item/ProjectLocation';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent } from '~/styles/section/section_item.css';

const Project: Component = () => {
  return (
    <SectionItem title='project.'>
      <div class={sectionContent} style={{ gap: '6px' }}>
        {/* <p class={sectionSubCaption}>Name.</p>
        <div style={{ 'padding-left': '4px' }}>
          <ProjectName />
        </div> */}
        <ProjectLocation />
        {/* <p class={sectionSubCaption}>File Control.</p>
        <div style={{ 'padding-left': '8px' }}>
          <ProjectSave />
        </div> */}
      </div>
    </SectionItem>
  );
};

export default Project;
