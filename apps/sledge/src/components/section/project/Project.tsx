import { Component } from 'solid-js';
import ProjectLocation from '~/components/section/project/item/ProjectLocation';
import ProjectName from '~/components/section/project/item/ProjectName';
import { sectionCaption, sectionContent, sectionRoot, sectionSubCaption } from '~/styles/section/section_item.css';

const Project: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>Project.</p>
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
    </div>
  );
};

export default Project;
