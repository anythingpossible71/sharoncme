export default function DevMyProjectsPage() {
  const projects = [
    { id: 1, name: 'Web App', status: 'Active', lastDeployed: '2 hours ago' },
    { id: 2, name: 'API Service', status: 'Active', lastDeployed: '1 day ago' },
    { id: 3, name: 'Mobile App', status: 'Inactive', lastDeployed: '1 week ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="mt-2 text-gray-600">
            Manage and monitor your development projects
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          New Project
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Projects</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {projects.map((project) => (
            <div key={project.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{project.name}</h4>
                <p className="text-sm text-gray-500">Last deployed {project.lastDeployed}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  project.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
                <button className="text-blue-600 hover:text-blue-900 text-sm">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
