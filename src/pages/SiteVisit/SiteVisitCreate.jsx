import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import "./SiteVisitCreate.css";
import { toast } from "react-hot-toast";

export default function SiteVisitCreate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const leadId = params.get("lead_id");
  const projectId = params.get("project_id");

  const [lead, setLead] = useState(null);
  const [project, setProject] = useState(null);

  const [availableUnits, setAvailableUnits] = useState([]);
  const [unitConfigs, setUnitConfigs] = useState([]);

  const [towers, setTowers] = useState([]);
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);

  const [form, setForm] = useState({
    lead: "",
    project: "",
    unit_config: "",
    tower: "",
    floor: "",
    inventory: "",
    scheduled_at: "",
    member_name: "",
    member_mobile_number: "",
    notes: "",
  });

  const handleChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  // LOAD LEAD DETAILS
  useEffect(() => {
    if (!leadId) return;
    api
      .get(`/sales/sales-leads/${leadId}/`)
      .then((res) => {
        setLead(res.data);
        setForm((f) => ({ ...f, lead: leadId }));
      })
      .catch(() => toast.error("Failed to load lead"));
  }, [leadId]);

  // LOAD LEAD (also contains project)
  useEffect(() => {
    if (!leadId) return;

    api
      .get(`/sales/sales-leads/${leadId}/`)
      .then((res) => {
        setLead(res.data);

        setForm((f) => ({
          ...f,
          lead: leadId,
          project: res.data.project, // take project from lead
        }));

        setProject({
          id: res.data.project,
          name: res.data.project_name,
        });
      })
      .catch(() => toast.error("Failed to load lead details"));
  }, [leadId]);


  // LOAD AVAILABLE INVENTORY
  useEffect(() => {
    if (!projectId) return;

    api
      .get(`/client/projects/${projectId}/available-units/`)
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];
        setAvailableUnits(data);

        const uniqueTowers = [...new Set(data.map((u) => u.tower))].map(
          (towerId) => {
            const row = data.find((u) => u.tower === towerId);
            return { id: towerId, name: row?.tower_name };
          }
        );

        setTowers(uniqueTowers);
      })
      .catch(() => toast.error("Failed to load units"));
  }, [projectId]);

  // LOAD UNIT CONFIGURATION
  useEffect(() => {
    api
      .get("/setup/unit-configurations/")
      .then((res) => {
        const items = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];
        setUnitConfigs(items);
      })
      .catch(() => toast.error("Failed to load unit configurations"));
  }, []);

  // WHEN TOWER SELECTED → SHOW FLOORS
  useEffect(() => {
    if (!form.tower) {
      setFloors([]);
      setUnits([]);
      return;
    }

    const f = availableUnits
      .filter((u) => u.tower === Number(form.tower))
      .map((u) => ({
        id: u.floor,
        name: u.floor_number,
      }));

    const uniqueFloors = [];
    const seen = new Set();
    f.forEach((x) => {
      if (!seen.has(x.id)) {
        seen.add(x.id);
        uniqueFloors.push(x);
      }
    });

    setFloors(uniqueFloors);
  }, [form.tower, availableUnits]);

  // WHEN FLOOR SELECTED → SHOW UNITS
  useEffect(() => {
    if (!form.floor) {
      setUnits([]);
      return;
    }

    const items = availableUnits.filter(
      (u) => u.tower === Number(form.tower) && u.floor === Number(form.floor)
    );

    setUnits(items);
  }, [form.floor, form.tower, availableUnits]);

  // SUBMIT
  const handleSubmit = async () => {
    if (!form.lead || !form.project || !form.scheduled_at) {
      toast.error("Required fields missing");
      return;
    }

    try {
await api.post("/sales/site-visits/", {
  lead_id: Number(form.lead),
  project_id: Number(form.project),
  unit_config_id: form.unit_config ? Number(form.unit_config) : null,
  inventory_id: form.inventory ? Number(form.inventory) : null,
  scheduled_at: form.scheduled_at,
  member_name: form.member_name,
  member_mobile_number: form.member_mobile_number,
  notes: form.notes,
});
      toast.success("Site Visit Scheduled");
      navigate(`/sales/lead/site-visit?lead_id=${leadId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create site visit");
    }
  };

  return (
    <div className="sv-container">
      {/* HEADER */}
      <div className="sv-header-grey">
        <span className="sv-header-title">Schedule A Site Visit</span>
      </div>

      {/* FORM */}
      <div className="sv-section">
        {/* Project + Lead + Unit Config */}
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Project</label>
            <input
              className="form-input"
              value={project?.name || ""}
              readOnly
            />
          </div>

          <div className="form-field">
            <label className="form-label">Lead</label>
            <input
              className="form-input"
              value={lead?.full_name || ""}
              readOnly
            />
          </div>

          <div className="form-field">
            <label className="form-label">Unit Configuration</label>
            <select
              className="form-input"
              value={form.unit_config}
              onChange={(e) => handleChange("unit_config", e.target.value)}
            >
              <option value="">Select</option>
              {unitConfigs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tower / Floor / Unit */}
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Tower</label>
            <select
              className="form-input"
              value={form.tower}
              onChange={(e) => handleChange("tower", e.target.value)}
            >
              <option value="">Select Tower</option>
              {towers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Floor</label>
            <select
              className="form-input"
              value={form.floor}
              onChange={(e) => handleChange("floor", e.target.value)}
            >
              <option value="">Select Floor</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Unit</label>
            <select
              className="form-input"
              value={form.inventory}
              onChange={(e) => handleChange("inventory", e.target.value)}
            >
              <option value="">Select Unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_no || `Unit #${u.unit}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visitor */}
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Visitor Name</label>
            <input
              className="form-input"
              value={form.member_name}
              onChange={(e) => handleChange("member_name", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Mobile Number</label>
            <input
              className="form-input"
              value={form.member_mobile_number}
              onChange={(e) =>
                handleChange("member_mobile_number", e.target.value)
              }
            />
          </div>

          <div className="form-field">
            <label className="form-label">Visit Date & Time</label>
            <input
              type="datetime-local"
              className="form-input"
              value={form.scheduled_at}
              onChange={(e) => handleChange("scheduled_at", e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="form-row">
          <div className="form-field-full">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sv-footer">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSubmit}>
          Create Visit
        </button>
      </div>
    </div>
  );
}
