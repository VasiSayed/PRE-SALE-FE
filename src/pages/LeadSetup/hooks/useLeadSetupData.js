import { useState, useEffect } from "react";
import { LeadSetupAPI, SetupAPI } from "../../../api/endpoints";

export function useLeadSetupData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setup, setSetup] = useState(null);
  const [leadSetup, setLeadSetup] = useState({
    classifications: [],
    sources: [],
    stages: [],
    purposes: [],
    statuses: [],
    offering_types: [],
  });
  const [projects, setProjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [users, setUsers] = useState([]);

  const loadData = async (projectId = null) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch setup bundle (for lookups like unit_types, facings, etc.)
      console.log("🔍 Fetching setup bundle...");
      const setupBundle = await SetupAPI.getBundle();
      console.log("✅ Setup Bundle received:", setupBundle);
      console.log("📦 Unit Types:", setupBundle?.lookups?.unit_types);
      setSetup(setupBundle);

      // Extract users from setup bundle
      const fetchedUsers = setupBundle?.users?.items || [];
      console.log("👥 Users extracted:", fetchedUsers);
      setUsers(fetchedUsers);

      // Fetch projects
      console.log("🔍 Fetching projects...");
      const scopeData = await SetupAPI.myScope({ include_units: true });
      console.log("✅ Scope Data received:", scopeData);
      const fetchedProjects = scopeData.projects || [];
      console.log("📋 Projects:", fetchedProjects);
      setProjects(fetchedProjects);

      // Determine which project to use for masters
      const projectIdToUse = projectId || fetchedProjects[0]?.id;

      if (!projectIdToUse) {
        throw new Error("No projects available");
      }

      console.log("🎯 Using project ID for masters:", projectIdToUse);
      setSelectedProjectId(projectIdToUse);

      // Fetch lead masters for that project
      console.log("🔍 Fetching lead masters...");
      const mastersData = await LeadSetupAPI.getMasters({
        project_id: projectIdToUse,
      });
      console.log("✅ Lead Masters received:", mastersData);
      console.log("🏢 Offering Types:", mastersData?.offering_types);
      setLeadSetup(mastersData);

      // Extract all units from all projects
      const allUnits = [];
      fetchedProjects.forEach((project) => {
        project.towers?.forEach((tower) => {
          tower.floors?.forEach((floor) => {
            floor.units?.forEach((unit) => {
              allUnits.push({ ...unit, project: project.id });
            });
          });
        });
      });
      console.log("📍 Total units extracted:", allUnits.length);
      setUnits(allUnits);
    } catch (err) {
      console.error("❌ Error loading lead setup data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const reload = (projectId = null) => {
    loadData(projectId);
  };

  return {
    setup,
    leadSetup,
    projects,
    units,
    users,
    selectedProjectId,
    loading,
    error,
    reload,
  };
}
