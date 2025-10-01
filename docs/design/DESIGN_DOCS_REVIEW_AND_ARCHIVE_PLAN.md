# Design Documentation Review & Archive Plan
## Forms-First Repositioning - Document Cleanup

**Date:** October 1, 2025
**Purpose:** Review all design documents and archive those not aligned with new forms-first positioning
**Status:** READY FOR EXECUTION

---

## Documents Review Summary

### KEEP - Aligned with Forms-First Direction (11 files)

#### **1. comprehensive_prd.md** ✅ NEW - MASTER DOCUMENT
- **Status:** KEEP - Primary PRD (forms-first, 80/20 split)
- **Created:** October 1, 2025
- **Size:** 80KB
- **Purpose:** Master product requirements with correct forms-first positioning
- **Action:** Use as primary reference, update other docs to align with this

#### **2. product_positioning.md** ✅ NEW - MASTER DOCUMENT
- **Status:** KEEP - Positioning and go-to-market strategy
- **Created:** October 1, 2025
- **Size:** 48KB
- **Purpose:** Market positioning, competitive analysis, pricing strategy
- **Action:** Use as primary positioning reference

#### **3. brave-forms-sad.md** ✅ EXCELLENT
- **Status:** KEEP - Software Architecture Document (board approved)
- **Last Updated:** September 3, 2025
- **Size:** 56KB
- **Assessment:** Most accurate technical document, already has forms-first emphasis
- **Action:** Minor updates only (add pricing tiers to user management section)

#### **4. brave-forms-nfr.md** ✅ EXCELLENT
- **Status:** KEEP - Non-Functional Requirements (production-ready)
- **Last Updated:** September 3, 2025
- **Size:** 37KB
- **Assessment:** Technically sound, aligns with forms management performance targets
- **Action:** No changes needed - use as implementation guide

#### **5. brave-forms-api-icd.md** ✅ KEEP
- **Status:** KEEP - API Interface Control Document
- **Last Updated:** September 3, 2025
- **Size:** 44KB
- **Purpose:** GraphQL API specifications
- **Action:** Review and update to include user role types (Field, Office, Inspector)

#### **6. database design document.md** ✅ KEEP
- **Status:** KEEP - Database schema documentation
- **Last Updated:** September 3, 2025
- **Size:** 18KB
- **Purpose:** PostgreSQL schema with multi-tenancy
- **Action:** Minor updates for user role pricing implementation

#### **7. brave-forms-ux-design-doc.md** ✅ KEEP
- **Status:** KEEP - UX Design specifications
- **Last Updated:** September 3, 2025
- **Size:** 37KB
- **Purpose:** Field-optimized UI specifications (gloves, sunlight, weather)
- **Action:** Ensure forms workflows are primary focus, compliance secondary

#### **8. PWA_vs_CAPACITOR_ARCHITECTURE_ANALYSIS.md** ✅ KEEP
- **Status:** KEEP - Technical decision documentation
- **Last Updated:** September 30, 2025
- **Size:** 25KB
- **Purpose:** Capacitor 6 vs PWA analysis with offline considerations
- **Action:** No changes needed - valuable technical reference

#### **9. brave-forms-use-cases.md** ✅ KEEP (UPDATE NEEDED)
- **Status:** KEEP but UPDATE - Use cases document
- **Last Updated:** September 3, 2025
- **Size:** 23KB
- **Assessment:** Needs rebalancing (likely compliance-heavy)
- **Action:** Update to emphasize forms use cases (80%) vs compliance (20%)

#### **10. sdp-brave-forms.md** ✅ KEEP
- **Status:** KEEP - Software Development Plan
- **Last Updated:** September 3, 2025
- **Size:** 33KB
- **Purpose:** Development methodology and practices
- **Action:** Minor updates to align sprint priorities with forms-first

#### **11. brave-forms-business-case.md** ✅ KEEP (UPDATE NEEDED)
- **Status:** KEEP but UPDATE - Business case and ROI
- **Last Updated:** September 3, 2025
- **Size:** 16KB
- **Assessment:** Needs reframing around forms time savings (primary) vs compliance fines (secondary)
- **Action:** Update per DESIGN_DOCS_UPDATE_SUMMARY.md (3-4 hours effort)

---

### ARCHIVE - Legacy/Superseded Documents (7 files)

#### **12. comprehensive_compliance_prd.md** 🗄️ ARCHIVE
- **Status:** ARCHIVE - Superseded by comprehensive_prd.md
- **Issue:** Compliance-first positioning (60% compliance, 40% forms)
- **Created:** September 3, 2025
- **Size:** 41KB
- **Reason:** Replaced by comprehensive_prd.md with correct 80/20 split
- **Archive Location:** docs/archive/design/legacy/comprehensive_compliance_prd.md

#### **13. brave-forms-product-vision.md** 🗄️ ARCHIVE (REWRITE NEEDED)
- **Status:** ARCHIVE then REWRITE - Product vision document
- **Issue:** Compliance-first messaging, contains emojis (violates CLAUDE.md v1.6)
- **Last Updated:** September 3, 2025
- **Size:** 17KB
- **Reason:** Needs complete rewrite per DESIGN_DOCS_UPDATE_SUMMARY.md
- **Action:** Archive old version, create new from comprehensive_prd.md executive summary
- **Archive Location:** docs/archive/design/legacy/brave-forms-product-vision.md

#### **14. Market Requirements Document.md** 🗄️ ARCHIVE (REWRITE NEEDED)
- **Status:** ARCHIVE then REWRITE
- **Issue:** EPA threshold error (0.5" vs 0.25"), compliance-first positioning
- **Last Updated:** September 3, 2025
- **Size:** 16KB
- **Reason:** Critical EPA error + needs rebalancing per DESIGN_DOCS_UPDATE_SUMMARY.md
- **Action:** Archive old, extract market research, create new aligned with comprehensive_prd.md
- **Archive Location:** docs/archive/design/legacy/Market-Requirements-Document.md

#### **15. brave-forms-frd.md** 🗄️ ARCHIVE (MAJOR REWRITE NEEDED)
- **Status:** ARCHIVE then MAJOR REWRITE
- **Issue:** Likely compliance-heavy (needs verification), module priorities wrong
- **Last Updated:** September 3, 2025
- **Size:** 30KB
- **Reason:** Per DESIGN_DOCS_UPDATE_SUMMARY.md: 8-12 hours rewrite (40 pages forms, 15 pages compliance)
- **Action:** Archive old, create new functional requirements from comprehensive_prd.md
- **Archive Location:** docs/archive/design/legacy/brave-forms-frd.md

#### **16. brave-forms-final-tech-stack.md** 🗄️ ARCHIVE (DUPLICATE)
- **Status:** ARCHIVE - Duplicate of TECH_STACK.md
- **Issue:** Multiple tech stack docs (consolidation needed per DOCUMENT_LIBRARY.md)
- **Last Updated:** September 30, 2025
- **Size:** 17KB
- **Reason:** Superseded by TECH_STACK_DETAILS.md (most current)
- **Archive Location:** docs/archive/design/duplicate/brave-forms-final-tech-stack.md

#### **17. Tech Stack Recommendations.md** 🗄️ ARCHIVE (DUPLICATE)
- **Status:** ARCHIVE - Duplicate tech stack document
- **Issue:** Part of 3-document duplication per DOCUMENT_LIBRARY.md
- **Last Updated:** September 30, 2025
- **Size:** 15KB
- **Reason:** Superseded by TECH_STACK_DETAILS.md
- **Archive Location:** docs/archive/design/duplicate/Tech-Stack-Recommendations.md

#### **18. TECH_STACK.md** 🗄️ ARCHIVE (DUPLICATE)
- **Status:** ARCHIVE - Duplicate tech stack document
- **Issue:** Part of 3-document duplication per DOCUMENT_LIBRARY.md
- **Last Updated:** September 4, 2025
- **Size:** 6KB
- **Reason:** Superseded by TECH_STACK_DETAILS.md (in docs/ root)
- **Archive Location:** docs/archive/design/duplicate/TECH_STACK.md

---

### REMOVE - Binary Files Not Needed (5 files)

#### **19. BrAve Forms Review 4-7-25.docx** ❌ REMOVE
- **Status:** REMOVE - Legacy Microsoft Word document
- **Size:** 808KB (largest file in folder)
- **Reason:** Binary format, likely outdated (April 7, 2025), content should be in markdown
- **Action:** Extract any unique content, then delete file

#### **20. BrAve Forms Manager TRD-PRD-Ver1.docx** ❌ REMOVE
- **Status:** REMOVE - Legacy Word document
- **Size:** 28KB
- **Reason:** Superseded by comprehensive_prd.md, binary format
- **Action:** Extract any unique content, then delete file

#### **21. Dev Log.docx** ❌ REMOVE
- **Status:** REMOVE - Development log in binary format
- **Size:** 24KB
- **Reason:** Development logs should be in git history or CHANGELOG.md
- **Action:** Move to docs/archive/dev-logs/ if contains unique historical context, otherwise delete

#### **22. GIRGID Screenshot 1 - Streets.png** ❌ REMOVE
- **Status:** REMOVE - Unrelated screenshot
- **Size:** 177KB
- **Reason:** GIRGID is not related to BrAve Forms project
- **Action:** Delete (wrong project)

#### **23. GIRGID Screenshot 2 - Homes on Rancho Rd.png** ❌ REMOVE
- **Status:** REMOVE - Unrelated screenshot
- **Size:** 143KB
- **Reason:** GIRGID is not related to BrAve Forms project
- **Action:** Delete (wrong project)

---

### INVESTIGATE - Unclear Purpose (2 files)

#### **24. Product Requirements Document.txt** ⚠️ INVESTIGATE
- **Status:** INVESTIGATE - Text file format PRD
- **Size:** 2KB
- **Last Updated:** September 15, 2025
- **Issue:** May duplicate comprehensive_compliance_prd.md per DOCUMENT_LIBRARY.md
- **Action:** Read contents, extract unique info, then archive or delete

#### **25. package.json** ⚠️ INVESTIGATE
- **Status:** INVESTIGATE - NPM package file in design folder
- **Size:** 1KB
- **Last Updated:** September 3, 2025
- **Issue:** Should not be in design/ folder (belongs in root or app folder)
- **Action:** Verify not needed, likely accidental placement, delete if safe

#### **26. revised_architecture_clerk.md** ✅ KEEP (MINOR UPDATES)
- **Status:** KEEP but UPDATE
- **Size:** 47KB
- **Last Updated:** September 3, 2025
- **Issue:** Minor version discrepancies (PostgreSQL 16 vs 15, React Native vs Capacitor 6)
- **Action:** Update per ULTRA_THINK_MODE_ANALYSIS.md findings

---

## Summary Statistics

**Total Files:** 26 files
- **Keep (Aligned):** 11 files (42%)
- **Archive (Legacy/Superseded):** 7 files (27%)
- **Remove (Binary/Unrelated):** 5 files (19%)
- **Investigate:** 3 files (12%)

**Disk Space:**
- Current: ~1.8MB
- After cleanup: ~450KB (75% reduction)

---

## Archive Structure

```
docs/archive/design/
├── legacy/                      # Superseded by new docs
│   ├── comprehensive_compliance_prd.md
│   ├── brave-forms-product-vision.md
│   ├── Market-Requirements-Document.md
│   └── brave-forms-frd.md
├── duplicate/                   # Multiple versions consolidated
│   ├── brave-forms-final-tech-stack.md
│   ├── Tech-Stack-Recommendations.md
│   └── TECH_STACK.md
└── extracted-content/           # Content extracted from binary files
    ├── BrAve-Forms-Review-4-7-25-EXTRACTED.md
    ├── BrAve-Forms-Manager-TRD-PRD-Ver1-EXTRACTED.md
    └── Dev-Log-EXTRACTED.md
```

---

## Action Plan

### Phase 1: Archive Setup (5 minutes)

```bash
# Create archive structure
mkdir -p docs/archive/design/legacy
mkdir -p docs/archive/design/duplicate
mkdir -p docs/archive/design/extracted-content
```

### Phase 2: Archive Legacy Documents (10 minutes)

```bash
# Move superseded compliance-first documents
mv docs/design/comprehensive_compliance_prd.md docs/archive/design/legacy/
mv docs/design/brave-forms-product-vision.md docs/archive/design/legacy/
mv docs/design/"Market Requirements Document.md" docs/archive/design/legacy/Market-Requirements-Document.md
mv docs/design/brave-forms-frd.md docs/archive/design/legacy/

# Create README in legacy folder explaining why archived
cat > docs/archive/design/legacy/README.md << 'EOF'
# Legacy Design Documents (Archived October 1, 2025)

These documents were archived during the forms-first repositioning initiative.

**Reason for Archive:** These documents positioned BrAve Forms as compliance-first (60% compliance, 40% forms) when the correct positioning is forms-first (80% forms, 20% compliance).

**Superseded By:**
- comprehensive_compliance_prd.md → comprehensive_prd.md
- brave-forms-product-vision.md → Rewrite in progress (using comprehensive_prd.md executive summary)
- Market Requirements Document.md → Rewrite in progress (with EPA threshold correction: 0.5" → 0.25")
- brave-forms-frd.md → Rewrite in progress (reordered: forms engine first, compliance last)

**Historical Value:** These documents contain valuable market research and competitive analysis that was extracted and incorporated into the new documents.
EOF
```

### Phase 3: Archive Duplicate Tech Stack Documents (5 minutes)

```bash
# Move duplicate tech stack docs
mv docs/design/brave-forms-final-tech-stack.md docs/archive/design/duplicate/
mv docs/design/"Tech Stack Recommendations.md" docs/archive/design/duplicate/Tech-Stack-Recommendations.md
mv docs/design/TECH_STACK.md docs/archive/design/duplicate/

# Create README explaining consolidation
cat > docs/archive/design/duplicate/README.md << 'EOF'
# Duplicate Tech Stack Documents (Archived October 1, 2025)

These three documents contained overlapping information about the BrAve Forms technology stack.

**Consolidated Into:** docs/TECH_STACK_DETAILS.md (master reference)

**Archived Files:**
- brave-forms-final-tech-stack.md
- Tech Stack Recommendations.md
- TECH_STACK.md

**Reason:** Per DOCUMENT_LIBRARY.md review, having 3 tech stack documents created inconsistencies and maintenance burden. All unique content was merged into TECH_STACK_DETAILS.md.
EOF
```

### Phase 4: Extract Content from Binary Files (15 minutes)

```bash
# For .docx files, use pandoc or manual extraction
# Example placeholder (requires manual extraction):
echo "Manual extraction required for binary files" > docs/archive/design/extracted-content/README.md
```

**Manual Steps:**
1. Open BrAve Forms Review 4-7-25.docx
2. Extract any unique content not in current markdown docs
3. Save as BrAve-Forms-Review-4-7-25-EXTRACTED.md
4. Repeat for other .docx files
5. Delete original binary files

### Phase 5: Remove Unrelated Files (2 minutes)

```bash
# Remove GIRGID screenshots (wrong project)
rm docs/design/"GIRGID Screenshot 1 - Streets.png"
rm docs/design/"GIRGID Screenshot 2 - Homes on Rancho Rd.png"
```

### Phase 6: Investigate Unclear Files (10 minutes)

```bash
# Read Product Requirements Document.txt
cat docs/design/"Product Requirements Document.txt"
# Decision: Archive or delete based on contents

# Check package.json
cat docs/design/package.json
# Decision: Delete if accidental placement
```

### Phase 7: Update DOCUMENT_LIBRARY.md (10 minutes)

Update docs/DOCUMENT_LIBRARY.md to reflect:
- New master documents (comprehensive_prd.md, product_positioning.md)
- Archived documents (legacy, duplicate folders)
- Removed files (binary, unrelated)
- Updated status for all documents

---

## Validation Checklist

After executing archive plan:

- [ ] All legacy documents moved to docs/archive/design/legacy/
- [ ] All duplicate documents moved to docs/archive/design/duplicate/
- [ ] Binary files extracted or deleted
- [ ] Unrelated files (GIRGID) removed
- [ ] README files created in archive folders
- [ ] DOCUMENT_LIBRARY.md updated
- [ ] Design folder contains only 11-14 active documents
- [ ] Disk space reduced by ~75%
- [ ] No broken references in active documents
- [ ] Git commit with clear message documenting archive

---

## Git Commit Message Template

```
docs: archive legacy design documents during forms-first repositioning

Archive 7 legacy/duplicate documents and remove 5 unrelated files from docs/design/:

ARCHIVED (Legacy - Compliance-First Positioning):
- comprehensive_compliance_prd.md → Superseded by comprehensive_prd.md
- brave-forms-product-vision.md → Rewrite in progress
- Market Requirements Document.md → Rewrite in progress (EPA threshold fix)
- brave-forms-frd.md → Rewrite in progress (reordered priorities)

ARCHIVED (Duplicates - Consolidated):
- brave-forms-final-tech-stack.md → Merged into TECH_STACK_DETAILS.md
- Tech Stack Recommendations.md → Merged into TECH_STACK_DETAILS.md
- TECH_STACK.md → Merged into TECH_STACK_DETAILS.md

REMOVED (Unrelated/Binary):
- BrAve Forms Review 4-7-25.docx (808KB, legacy Word doc)
- BrAve Forms Manager TRD-PRD-Ver1.docx (28KB, superseded)
- Dev Log.docx (24KB, should be in git history)
- GIRGID Screenshot 1 & 2 (320KB, wrong project)

NEW MASTER DOCUMENTS:
+ comprehensive_prd.md (80KB, forms-first positioning)
+ product_positioning.md (48KB, go-to-market strategy)

Result: Design folder reduced from 26 files (1.8MB) to 11 active files (450KB)

Refs: ULTRA_THINK_MODE_ANALYSIS.md, DESIGN_DOCS_UPDATE_SUMMARY.md
```

---

**Execution Status:** READY TO EXECUTE
**Estimated Time:** 60 minutes
**Risk Level:** LOW (all files backed up in archive, not deleted)
**Rollback:** Copy files back from docs/archive/design/ if needed

---

_Next Steps: Execute archive plan, then update remaining 11 active documents per DESIGN_DOCS_UPDATE_SUMMARY.md_
