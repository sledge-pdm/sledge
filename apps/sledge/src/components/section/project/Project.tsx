import { Component } from 'solid-js';
import ProjectLocation from '~/components/section/project/item/ProjectLocation';
import ProjectName from '~/components/section/project/item/ProjectName';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent, sectionSubCaption } from '~/styles/section/section_item.css';

const Project: Component = () => {
  return (
    <SectionItem title='project.'>
      <div class={sectionContent} style={{ 'padding-left': '8px', gap: '6px', 'margin-bottom': '8px' }}>
        <p class={sectionSubCaption}>Name.</p>
        <div style={{ 'padding-left': '4px' }}>
          <ProjectName />
        </div>
        <p class={sectionSubCaption}>Location.</p>
        <div style={{ 'padding-left': '4px' }}>
          <ProjectLocation />
        </div>
        {/* <p class={sectionSubCaption}>File Control.</p>
        <div style={{ 'padding-left': '8px' }}>
          <ProjectSave />
        </div> */}
      </div>
    </SectionItem>
  );
};

export default Project;
