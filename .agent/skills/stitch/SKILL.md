# Stitch Design Skill

This skill allows the agent to interact with **Stitch**, a tool for generating and editing UI designs. For this project (**Smart Grievance System**), Stitch is used to maintain a high-end, 3D interactive interface.

## Core Workflows

### 1. Project Management
- **List Projects**: Use `list_projects` to see all available projects.
- **Get Project Details**: Use `get_project(name="projects/...")` to see screens and design systems.

### 2. Screen Generation & Editing
- **Generate Screen**: Use `generate_screen_from_text` to create new UI components or pages.
- **Edit Screens**: Use `edit_screens` to modify existing screens based on feedback.
- **Variants**: Use `generate_variants` to explore different design options for a screen.

### 3. Design System
- **Apply Design System**: Use `apply_design_system` to ensure new or modified screens match the project's visual identity.
- **Update Design System**: Use `update_design_system` to tweak global colors, typography, or the "Design MD" strategy.

## Context for Smart Grievance System
The project uses a **"Dimensional Interface"** strategy:
- **Theme**: Dark mode (`#0b0e14`).
- **Typography**: Space Grotesk (headlines), Inter/Manrope (data).
- **Aesthetic**: Glassmorphism, 3D depth, tonal layering (no solid borders).
- **Key Project ID**: `771656019562059058` (Smart Grievance System PRD).

## Tool Map
| Tool | Purpose |
| :--- | :--- |
| `create_project` | Start a new design container. |
| `get_project` | Sync current screens and tokens. |
| `list_screens` | Audit all UI pages in a project. |
| `generate_screen_from_text` | Create UI from a prompt. |
| `edit_screens` | Update specific UI elements. |
| `apply_design_system` | Batch update style across screens. |
