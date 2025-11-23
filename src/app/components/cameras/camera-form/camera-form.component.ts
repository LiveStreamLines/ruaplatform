import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CameraService } from '../../../services/camera.service';
import { DeveloperService } from '../../../services/developer.service';
import { ProjectService } from '../../../services/project.service';
import { Camera } from '../../../models/camera.model';
import { Developer } from '../../../models/developer.model';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-camera-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './camera-form.component.html',
  styleUrls: ['./camera-form.component.css']
})
export class CameraFormComponent implements OnInit {
  cameraForm: FormGroup;
  developers: Developer[] = [];
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  allAvailableProjects: Project[] = [];  // All projects for additional projects selection
  availableProjectsForSelection: Project[] = [];  // Projects available for selection (excludes main project in edit mode)
  selectedDeveloper!: Developer;
  selectedProject!: Project;
  isEditing = false;

  constructor(
    private fb: FormBuilder,
    private cameraService: CameraService,
    private developerService: DeveloperService,
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.cameraForm = this.fb.group({
      developer: ['', Validators.required],
      project: ['', Validators.required],
      cameraDescription: [''],
      lat: ['', Validators.required],
      lng: ['', Validators.required],
      isActive: [true],
      additionalProjects: [[]]  // Array of project IDs
    });
  }

  ngOnInit(): void {
    console.log(this.isEditing);
    this.loadDevelopers();
    this.loadAllProjects();  // Load all projects for additional projects selection

    this.route.paramMap.subscribe(params => {
      const developerId = params.get('developerId') ?? '';
      const projectId = params.get('projectId') ?? '';
      console.log(developerId, projectId);

      if (developerId && projectId) {
        this.isEditing = true;
        this.developerService.getDeveloperById(developerId).subscribe(developer => {
          this.selectedDeveloper = developer;
          this.cameraForm.patchValue({ developer: developer._id });
        });

        this.projectService.getProjectById(projectId).subscribe(project => {
          this.selectedProject = project;
          this.cameraForm.patchValue({ project: project._id });
        });
      } else {
        this.isEditing = false;
      }

      const cameraId = this.route.snapshot.paramMap.get('id');
      if (cameraId) {
        this.isEditing = true;  // Editing existing camera
        this.cameraService.getCameraById(cameraId).subscribe(camera => {
          this.developerService.getDeveloperById(camera.developer).subscribe(developer => {
            this.selectedDeveloper = developer;
            this.cameraForm.patchValue({ developer: developer._id });
          });
          this.projectService.getProjectById(camera.project).subscribe(project => {
            this.selectedProject = project;
            this.cameraForm.patchValue({ project: project._id });
            
            // Filter out the main project from available projects for selection
            this.updateAvailableProjectsForSelection(project._id);
          });
          
          // Only show additional projects in the multi-select (not the main project)
          this.cameraForm.patchValue({
            ...camera,
            additionalProjects: camera.additionalProjects || []
          });
          this.loadProjectsByDeveloper(camera.developer);
        });
      }
    });
  }

  loadDevelopers(): void {
    this.developerService.getAllDevelopers().subscribe({
      next: (developers) => (this.developers = developers),
      error: (error) => console.error('Error fetching developers:', error),
    });
  }

  loadProjectsByDeveloper(developerId: string): void {
    this.projectService.getProjectsByDeveloper(developerId).subscribe(projects => {
      this.projects = projects;
      this.filteredProjects = projects;
    });
  }

  loadAllProjects(): void {
    this.projectService.getAllProjects().subscribe(projects => {
      this.allAvailableProjects = projects;
      // If editing and we have a main project, filter it out
      if (this.isEditing && this.selectedProject) {
        this.updateAvailableProjectsForSelection(this.selectedProject._id);
      } else {
        this.availableProjectsForSelection = projects;
      }
    });
  }

  updateAvailableProjectsForSelection(mainProjectId: string): void {
    // Filter out the main project from available projects
    this.availableProjectsForSelection = this.allAvailableProjects.filter(
      proj => proj._id !== mainProjectId
    );
  }

  onDeveloperChange(event: Event): void {
    const developerId = (event.target as HTMLSelectElement).value;
    this.loadProjectsByDeveloper(developerId);
  }

  onSubmit(): void {
    if (this.cameraForm.valid) {
      const formValue = this.cameraForm.value;
      
      // Get selected projects from multi-select
      let selectedProjects: string[] = [];
      if (formValue.additionalProjects) {
        if (Array.isArray(formValue.additionalProjects)) {
          selectedProjects = formValue.additionalProjects.filter((id: string) => id);
        } else if (typeof formValue.additionalProjects === 'string') {
          selectedProjects = [formValue.additionalProjects];
        }
      }
      
      // Determine main project and additional projects
      let mainProjectId: string;
      let additionalProjects: string[] = [];
      
      if (this.isEditing) {
        // In edit mode: keep the original main project, selected projects are additional
        mainProjectId = formValue.project;  // Keep the original main project
        additionalProjects = selectedProjects.filter((id: string) => id && id !== mainProjectId);
      } else {
        // In add mode: use the selected project as main, others as additional
        mainProjectId = formValue.project;
        // Exclude main project from additional projects
        additionalProjects = selectedProjects.filter((id: string) => id && id !== mainProjectId);
      }
      
      // Prepare camera data as JSON object
      const cameraData: any = {
        developer: formValue.developer,
        project: mainProjectId,
        cameraDescription: formValue.cameraDescription || '',
        lat: formValue.lat,
        lng: formValue.lng,
        isActive: formValue.isActive
      };
      
      // Add additionalProjects if any
      if (additionalProjects.length > 0) {
        cameraData.additionalProjects = additionalProjects;
      } else {
        // Ensure additionalProjects is an empty array if none
        cameraData.additionalProjects = [];
      }

      const cameraId = this.route.snapshot.paramMap.get('id');
      console.log('Submitting camera data:', cameraData);
      if (cameraId) {
        // Editing existing camera - send as JSON using updateCamera
        this.cameraService.updateCamera(cameraId, cameraData).subscribe({
          next: (response) => {
            console.log('Camera updated successfully:', response);
            this.router.navigate(['/cameras']);
          },
          error: (error) => {
            console.error('Error updating camera:', error);
            console.error('Error details:', error.error);
          }
        });
      } else {
        // Adding new camera - send as JSON
        this.cameraService.addCamera(cameraData).subscribe({
          next: (response) => {
            console.log('Camera added successfully:', response);
            this.router.navigate(['/cameras']);
          },
          error: (error) => {
            console.error('Error adding camera:', error);
            console.error('Error details:', error.error);
          }
        });
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/cameras']);
  }
}
