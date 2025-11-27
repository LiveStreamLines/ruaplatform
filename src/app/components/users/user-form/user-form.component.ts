import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '../../../services/users.service';
import { DeveloperService } from '../../../services/developer.service';
import { ProjectService } from '../../../services/project.service';
import { CameraService } from '../../../services/camera.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
})

export class UserFormComponent implements OnInit {

  userForm!: FormGroup;
  isEditing: boolean = false;
  submitted: boolean = false;
  userId: string | null = null; // Store user ID when editing
  hidepermissions: boolean = false;
  isAllDevSelected: boolean = false;
  isAllProjSelected: boolean = false;
  isAllCameraSelected: boolean = false;
  isAllServiceSelected: boolean = false;

  userRole: string | null = null;
  accessibleDeveloper: string[]=[];
  accessibleProject: string[]=[];
  accessibleCamera: string[]=[];
  isSuperAdmin: boolean = false;

  roles: string[] = ['Super Admin', 'User'];
  developers: any[] = []; // Replace with actual developer data
  projects: any[] = []; // Replace with actual project data
  cameras: any[] = []; // Replace with actual camera data
  services: string[] = [
    'Time lapse',
    'Live Streaming',
    'Drone Shooting',
    'Site Photography & Videography',
    '360 Photography & Videography',
    'Satellite Imagery'
  ];

  constructor(
    private fb: FormBuilder, 
    private userService: UserService, 
    private developerService: DeveloperService,
    private projectService: ProjectService,
    private cameraService: CameraService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router) {}
  
  
  ngOnInit(): void {
    this.isSuperAdmin = this.authService.getUserRole() === 'Super Admin';
    this.accessibleDeveloper = this.authService.getAccessibleDevelopers();
    this.accessibleProject = this.authService.getAccessibleProjects();
    this.accessibleCamera = this.authService.getAccessibleCameras();


    this.userId = this.route.snapshot.paramMap.get('id'); // Get the user ID from the route
    this.isEditing = !!this.userId; // If there's an ID, it's edit mode
  
    this.initializeForm();

    const role = this.authService.getUserRole();
    if (role === 'Super Admin') {
      this.userForm.get('phone')?.enable(); // To enable the field
      this.userForm.get('role')?.enable(); // Disable the control programmatically
      this.userForm.get('email')?.enable(); // Enable email for super admin
    } else {
      // Only disable email when editing (not when adding new users)
      if (this.isEditing) {
        this.userForm.get('email')?.disable(); // Disable email for non-super admin when editing
      }
    }

    // Load necessary data
    this.loadDevelopers();

    // Watch for changes in the role field
    this.userForm.get('role')?.valueChanges.subscribe((role: string) => {
      if (role === 'Super Admin') {
        this.hidepermissions = true;
        this.clearAccessibles();
        this.clearPermissions();
      } else {
        // User role
        this.hidepermissions = false;
      }
    });   
  }

  initializeForm(): void {
    this.userForm = this.fb.group(
      {
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: [{ value: '', disabled: true}],
        role: [{value: 'User', disabled: true}, Validators.required],
        accessibleDevelopers: [['all']], // Always set to 'all', hidden from UI
        accessibleProjects: [[]],
        accessibleCameras: [[]],
        accessibleServices: [['all']], // Always set to 'all', hidden from UI
        accessibleMemories: [['all']], // Always set to 'all', hidden from UI
        canAddUser: [false],        // Always false, removed from UI
        canGenerateVideoAndPics: [true]    // Always true, removed from UI
      }
    );
    if (this.isEditing) {
      this.loadUserData();
    }
  }


  loadDevelopers(): void {
    this.developerService.getAllDevelopers().subscribe({
      next: (developers) => {
        if (this.isSuperAdmin || (this.accessibleDeveloper[0] === 'all')) {
          this.developers = developers;
        } else {
          this.developers = developers.filter(dev => this.accessibleDeveloper.includes(dev._id));
        }
        
        // Always set accessibleDevelopers to 'all' and load all projects
        this.userForm.get('accessibleDevelopers')?.setValue(['all']);
        this.loadProjectsByDevelopers(['all']);
      },
      error: (error) => console.error('Error fetching developers:', error),
    });
  }



  loadProjectsByDevelopers(developerIds: string[]): void {
    if (developerIds.includes('all')) {
      // Load all projects so users can select individual projects or "All"
      this.projects = []; // Clear current projects first
      this.projectService.getAllProjects().subscribe({
        next: (projects) => {
          if (this.accessibleProject[0] !== 'all' && !this.isSuperAdmin) {
            this.projects = projects.filter(project => this.accessibleProject.includes(project._id));
          } else {
            this.projects = projects;
          }
        },
        error: (error) => console.error('Error fetching all projects:', error),
      });
      return;
    }

    this.projects = []; // Clear current projects
    if (developerIds && developerIds.length > 0) {
      developerIds.forEach((developerId) => {
        this.projectService.getProjectsByDeveloper(developerId).subscribe({
        next: (projects) => {        
            if (this.accessibleProject[0] !== 'all' && !this.isSuperAdmin) {
            this.projects = [...this.projects, 
              ...projects.filter(project => this.accessibleProject.includes(project._id))];    // Merge new projects with the existing list       
            } else {
              this.projects = [...this.projects, ...projects];
            }
        },
        error: (error) => console.error('Error fetching projects:', error),
       });
      });
    } else {
      this.projects = []; // Clear projects if no developer is selected
      this.userForm.get('accessibleProjects')?.setValue([]);
    }
  }

  loadCamerasByProjects(projectIds: string[]): void {
    if (this.isSuperAdmin && projectIds.includes('all')) {
      // Only set "all" cameras for super admin when "all" projects are selected
      this.userForm.get('accessibleCameras')?.setValue(['all']);
      this.cameras = []; // Disable camera selection
      return;
    }

    this.cameras = []; // Clear current cameras
    if (projectIds && projectIds.length > 0) {
      projectIds.forEach((projectId) => {
        this.cameraService.getCamerasByProject(projectId).subscribe({
          next: (cameras) => {
            if (this.accessibleCamera[0] !== 'all' && !this.isSuperAdmin) {
              this.cameras = [...this.cameras, 
                ...cameras.filter(camera => this.accessibleCamera.includes(camera._id))];    // Filter cameras by accessible cameras       
            } else {
              this.cameras = [...this.cameras, ...cameras];
            }
          },
          error: (error) => console.error('Error fetching cameras:', error),
        });
      });
    } else {
      this.cameras = []; // Clear cameras if no project is selected
      this.userForm.get('accessibleCameras')?.setValue([]);
    }
  }

  loadUserData(): void {
    if (this.userId) {
      this.userService.getUserById(this.userId).subscribe((user) => {
        console.log(user);
        // Always set accessibleDevelopers to 'all' regardless of existing value
        this.userForm.get('accessibleDevelopers')?.setValue(['all']);
        this.loadProjectsByDevelopers(['all']);
        
        // For editing, preserve the email even if user is not super admin
        if (!this.isSuperAdmin) {
          // Temporarily enable email field to set the value
          this.userForm.get('email')?.enable();
          this.userForm.patchValue(user);
          this.userForm.get('email')?.disable();
        } else {
          this.userForm.patchValue(user);
        }
        
        // Always set accessible services to "All"
        this.userForm.get('accessibleServices')?.setValue(['all']);
        
        // Always set accessible memories to "All" (if field exists in user data, otherwise set it)
        this.userForm.get('accessibleMemories')?.setValue(['all']);
        
        // Always set canAddUser to false and canGenerateVideoAndPics to true
        this.userForm.get('canAddUser')?.setValue(false);
        this.userForm.get('canGenerateVideoAndPics')?.setValue(true);
      });
    }
  }


  onSelectionChange(field: string, event: any): void {
    const selectedValues = event.value;

    // accessibleDevelopers is always 'all' and hidden, so this handler is not needed
    // but kept for backward compatibility
    if (field === 'accessibleDevelopers') {
      // Always set to 'all' regardless of selection
      this.userForm.get('accessibleDevelopers')?.setValue(['all']);
      
      if (selectedValues.includes('all')) {
        // When "All" is selected
        this.isAllDevSelected = true;
        // Automatically set "all" for projects and cameras
        this.userForm.get('accessibleProjects')?.setValue(['all']);
        this.userForm.get('accessibleCameras')?.setValue(['all']);
        this.projects = []; // Clear list to disable selection
        this.cameras = [];
      } else {
        // When "All" is deselected
        this.isAllDevSelected = false;
        // Reload projects and cameras based on the current developer selection
        this.loadProjectsByDevelopers(selectedValues);
        this.loadCamerasByProjects([]);
      }
    }

    if (field === 'accessibleProjects') {
      if (selectedValues.includes('all')) {
        // When "All" is selected
        this.isAllProjSelected = true;
        this.userForm.get('accessibleProjects')?.setValue(['all']);
        // Automatically set "all" for cameras
        this.userForm.get('accessibleCameras')?.setValue(['all']);
        this.cameras = []; // Clear cameras since "all" projects are selected
      } else {
        // When "All" is deselected
        this.isAllProjSelected = false;
        this.userForm.get('accessibleProjects')?.setValue(selectedValues);

        // Reload cameras based on the current project selection
        this.loadCamerasByProjects(selectedValues);
      }
    }

    if (field === 'accessibleCameras') {
      if (selectedValues.includes('all')) {
        // When "All" is selected
        this.isAllCameraSelected = true;
        this.userForm.get('accessibleCameras')?.setValue(['all']);
      } else {
        // When "All" is deselected
        this.isAllCameraSelected = false;
        this.userForm.get('accessibleCameras')?.setValue(selectedValues);
      }
    }

    if (field === 'accessibleServices') {
      // Always set to 'all' regardless of selection (field is hidden)
      this.userForm.get('accessibleServices')?.setValue(['all']);
      this.isAllServiceSelected = true;
    }
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    let userData = this.userForm.value || {};
    if(!userData.role) {
      userData = {...userData, role:'User'};
    }
    const addingUserId = this.authService.getUserId();
    const addingUserName = this.authService.getUsername();

    // Always set these values regardless of form state
    userData = {
      ...userData, 
      accessibleDevelopers: ['all'],
      accessibleServices: ['all'],
      accessibleMemories: ['all'],
      canAddUser: false,
      canGenerateVideoAndPics: true,
      addedUserId: `${addingUserId}`, 
      addedUserName: `${addingUserName}`, 
      status: "New"
    };

    if (this.isEditing) {
      this.userService
        .updateUser(this.userId!, userData)
        .subscribe(() => {
          this.submitted = true;
          console.log('User updated successfully');
        });
    } else {
      this.userService.addUser(userData).subscribe({
        next: (response: any) => {
          this.submitted = true;
          this.userId = response._id; // Assuming the backend returns `user_id` in the response
          console.log('User added successfully');
        },
        error: (err) => {
          if (err?.error?.message === 'Email is already Registered') {
            alert('This email is already registered. Please use a different email.');
          } else {
            console.error('Error adding user:', err);
            alert('An error occurred while adding the user.');
          }
        }      
      });
    }
  }

  clearAccessibles(): void {
    // Clear accessible fields and their dependent dropdowns
    // Note: accessibleDevelopers, accessibleServices, and accessibleMemories always remain ['all']
    this.userForm.get('accessibleDevelopers')?.setValue(['all']); // Always 'all'
    this.userForm.get('accessibleProjects')?.setValue([]);
    this.userForm.get('accessibleCameras')?.setValue([]);
    this.userForm.get('accessibleServices')?.setValue(['all']); // Always 'all'
    this.userForm.get('accessibleMemories')?.setValue(['all']); // Always 'all'
  }

  clearPermissions(): void {
    // Always set these values
    this.userForm.get('canAddUser')?.setValue(false);
    this.userForm.get('canGenerateVideoAndPics')?.setValue(true);
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }


}
