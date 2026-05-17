document.addEventListener("DOMContentLoaded", () => {
    // Initialize Icons
    lucide.createIcons();

    // 1. Map Generation & Dragging Logic
    const gridSystem = document.getElementById("grid-system");
    const mapContainer = document.getElementById("map-container");
    const userLocation = document.getElementById("user-location");
    
    const gridSize = 50; // 50px per cell
    const cols = 30;
    const rows = 20;

    // Center map initially
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let startX, startY;

    // Node Data
    const nodes = [
        { id: 'E-05', type: 'kinetic', title: 'Dynamic Flow Pathway', desc: 'Walk or sprint through the motion sensors to generate grid energy.', energy: 25, flow: 10, x: -100, y: -50 },
        { id: 'G-08', type: 'zen', title: 'Meditation Ring', desc: 'Maintain stillness in the zone for 5 minutes. Sync your breathing with the grid.', energy: 10, flow: 50, x: 50, y: 0 },
        { id: 'B-12', type: 'social', title: 'Sync Hub', desc: 'Connect with a nearby user to initiate a dual-activation sequence.', energy: 40, flow: 20, x: -200, y: 150 },
        { id: 'K-03', type: 'kinetic', title: 'Jump Matrix', desc: 'Traverse the elevated platforms across the creek area in under 30 seconds.', energy: 35, flow: 15, x: 250, y: -150 },
        { id: 'H-10', type: 'social', title: 'Acoustic Shell', desc: 'Contribute a sound to the park\'s ambient generative track.', energy: 15, flow: 30, x: 100, y: 100 }
    ];

    // Calculate generic distance states for cells
    const assignCellDistanceClass = (xPos, yPos, cellElement) => {
        let minNodeDist = Math.hypot(xPos - 0, yPos - 50); // simulate user distance
        nodes.forEach(n => {
            const d = Math.hypot(xPos - n.x, yPos - n.y);
            if (d < minNodeDist) minNodeDist = d;
        });

        if (minNodeDist < 80) {
            cellElement.classList.add("state-active");
            // Add type-specific soft tint if it's near a node
            const nearbyNode = nodes.find(n => Math.hypot(xPos - n.x, yPos - n.y) < 100);
            if (nearbyNode) cellElement.classList.add(`tint-${nearbyNode.type}`);
        } else if (minNodeDist < 180) {
            cellElement.classList.add("state-semi");
        } else if (minNodeDist < 400) {
            cellElement.classList.add("state-passive");
        } else {
            cellElement.classList.add("state-inactive");
        }
    };

    // Generate grid cells
    const grid3d = document.getElementById("grid-3d-overlay");
    for(let r = 0; r < rows; r++) {
        for(let c = 0; c < cols; c++) {
            const xPos = (c - cols/2) * gridSize;
            const yPos = (r - rows/2) * gridSize;
            const colId = String.fromCharCode(65 + c);
            const rowId = (r + 1).toString().padStart(2, '0');
            const dataId = `${colId}-${rowId}`;

            // 1. Generate 2D Cell
            const cell2d = document.createElement("div");
            cell2d.classList.add("grid-cell");
            cell2d.style.left = `calc(50% + ${xPos}px)`;
            cell2d.style.top = `calc(50% + ${yPos}px)`;
            cell2d.dataset.id = dataId;
            cell2d.innerText = dataId;
            cell2d.style.pointerEvents = 'auto'; // allow clicks
            assignCellDistanceClass(xPos, yPos, cell2d);
            gridSystem.appendChild(cell2d);

            // 2. Generate 3D Cell
            if(grid3d) {
                const cell3d = document.createElement("div");
                cell3d.classList.add("grid-cell-3d");
                cell3d.style.left = `calc(50% + ${xPos}px)`;
                cell3d.style.top = `calc(50% + ${yPos}px)`;
                cell3d.dataset.id = dataId;
                cell3d.style.pointerEvents = 'auto'; // allow clicks

                const label3d = document.createElement("div");
                label3d.classList.add("cell-label-3d");
                label3d.innerText = dataId; // Label on EVERY cell
                cell3d.appendChild(label3d);

                assignCellDistanceClass(xPos, yPos, cell3d);
                grid3d.appendChild(cell3d);
            }
        }
    }

    // Node Data was moved above

    // Place Nodes
    nodes.forEach(node => {
        const el = document.createElement('div');
        el.className = `node type-${node.type}`;
        el.style.left = `calc(50% + ${node.x}px)`;
        el.style.top = `calc(50% + ${node.y}px)`;
        
        // Icon based on type
        let iconName = 'zap';
        if(node.type === 'social') iconName = 'users';
        if(node.type === 'zen') iconName = 'wind';
        
        el.innerHTML = `<i data-lucide="${iconName}"></i>`;
        
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            openBottomSheet(node);
            
            // Highlight nodes
            document.querySelectorAll('.node').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
        });

        gridSystem.appendChild(el);

        // Cloned Node for 3D Overlay
        if(grid3d) {
            const el3d = document.createElement('div');
            el3d.className = `node-3d type-${node.type}`;
            el3d.style.left = `calc(50% + ${node.x}px)`;
            el3d.style.top = `calc(50% + ${node.y}px)`;
            el3d.innerHTML = `<i data-lucide="${iconName}"></i>`;
            
            el3d.addEventListener('click', (e) => {
                e.stopPropagation();
                openBottomSheet(node);
                document.querySelectorAll('.node-3d').forEach(n => n.classList.remove('active'));
                el3d.classList.add('active');
                
                // Highlight corresponding 3D grid cell
                document.querySelectorAll('.grid-cell-3d').forEach(c => c.classList.remove('active-zone'));
                // Find cell near this coordinate
                const colIndex = Math.floor((node.x + (cols/2)*gridSize) / gridSize);
                const rowIndex = Math.floor((node.y + (rows/2)*gridSize) / gridSize);
                const colId = String.fromCharCode(65 + colIndex);
                const rowId = (rowIndex + 1).toString().padStart(2, '0');
                const targetCell = Array.from(document.querySelectorAll('.grid-cell-3d')).find(c => c.dataset.id === `${colId}-${rowId}`);
                if(targetCell) targetCell.classList.add('active-zone');
            });
            grid3d.appendChild(el3d);
        }
    });
    
    // Re-initialize lucide for new nodes
    lucide.createIcons();

    // Map Mode State
    let currentMapMode = '2D';
    let orbitIndex = 0;
    let orbitStartX = 0;
    
    // Toggle Elements
    const btn2d = document.getElementById('btn-2d');
    const btn3d = document.getElementById('btn-3d');
    const orbitSystem = document.getElementById('orbit-system');
    const orbitImages = document.querySelectorAll('.park-3d-img');
    const dragHint = document.querySelector('.drag-hint');
    
    if (btn2d && btn3d) {
        btn2d.addEventListener('click', () => {
            currentMapMode = '2D';
            btn2d.classList.add('active');
            btn3d.classList.remove('active');
            orbitSystem.style.opacity = '0';
            orbitSystem.style.pointerEvents = 'none';
            gridSystem.style.opacity = '1';
            gridSystem.style.pointerEvents = 'auto'; // allow node clicking
        });

        btn3d.addEventListener('click', () => {
            currentMapMode = '3D';
            btn3d.classList.add('active');
            btn2d.classList.remove('active');
            orbitSystem.style.opacity = '1';
            orbitSystem.style.pointerEvents = 'auto';
            gridSystem.style.opacity = '0';
            gridSystem.style.pointerEvents = 'none';
            if(typeof closeBottomSheet === "function") closeBottomSheet();
            document.querySelectorAll('.node').forEach(n => n.classList.remove('active'));
        });
    }

    const updateOrbitView = (direction) => {
        if (direction === 'prev') {
            orbitIndex = (orbitIndex - 1 + orbitImages.length) % orbitImages.length;
        } else {
            orbitIndex = (orbitIndex + 1) % orbitImages.length;
        }
        orbitImages.forEach(img => img.classList.remove('active'));
        if(orbitImages[orbitIndex]) orbitImages[orbitIndex].classList.add('active');

        // Apply synchronized rotation to the 3D map overlay grid
        if(grid3d) {
            // Assume the 5 screenshots are spaced ~72 degrees apart. Base is 45deg offset.
            const angle = 45 + (orbitIndex * -72);
            grid3d.style.transform = `translate(-50%, -50%) perspective(1500px) rotateX(60deg) rotateZ(${angle}deg) translateZ(8px)`;
        }
    };

    const orbitPrevBtn = document.getElementById('orbit-prev');
    const orbitNextBtn = document.getElementById('orbit-next');
    if (orbitPrevBtn && orbitNextBtn) {
        orbitPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); updateOrbitView('prev'); });
        orbitNextBtn.addEventListener('click', (e) => { e.stopPropagation(); updateOrbitView('next'); });
    }

    // Map Dragging & Zooming
    let currentScale = 1;
    let initialDistance = null;
    let initialScale = 1;
    let hasDragged = false;

    const getDistance = (touch1, touch2) => {
        return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    };

    const updateMapTransform = () => {
        gridSystem.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) scale(${currentScale})`;
        gridSystem.style.setProperty('--map-scale', currentScale);

        if (currentMapMode === '2D') {
            // Increase plan contrast/opacity as we zoom in
            const mapOp = Math.min(1, 0.7 + (currentScale - 0.5) * 0.3);
            gridSystem.style.setProperty('--map-opacity', mapOp);

            // Hide labels when zoomed far out for a cleaner "satellite" view
            const labelOp = currentScale < 0.7 ? 0 : 1;
            gridSystem.style.setProperty('--label-opacity', labelOp);
        }
    };

    const handleDragStart = (e) => {
        hasDragged = false;
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        isDragging = true;

        if (currentMapMode === '3D') {
            orbitStartX = clientX;
            if (dragHint) dragHint.style.opacity = '0'; // hide hint on first drag
            return;
        }

        if (e.touches && e.touches.length === 2) {
            initialDistance = getDistance(e.touches[0], e.touches[1]);
            initialScale = currentScale;
            isDragging = false;
            return;
        }

        startX = clientX - currentX;
        startY = clientY - currentY;
    };

    const handleDragMove = (e) => {
        if (e.cancelable && e.target.closest('#map-container')) {
            e.preventDefault();
        }

        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        if (currentMapMode === '3D') {
            if (!isDragging) return;
            const dragDist = clientX - orbitStartX;
            
            // Scrub 5 views across dragging
            if (Math.abs(dragDist) > 30) {
                if (dragDist > 0) {
                    updateOrbitView('prev');
                } else {
                    updateOrbitView('next');
                }
                orbitStartX = clientX; // reset relative
            }
            return;
        }

        if (e.touches && e.touches.length === 2) {
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            if (initialDistance) {
                const scaleModifier = currentDistance / initialDistance;
                currentScale = initialScale * scaleModifier;
                
                // Dynamic minimum scale to ensure edge-to-edge filling
                const rect = mapContainer.getBoundingClientRect();
                const minScale = Math.max(rect.width / 1500, rect.height / 1000) * 1.1; 
                currentScale = Math.max(minScale, Math.min(3, currentScale)); 
                updateMapTransform();
            }
            return;
        }

        if (!isDragging) return;

        hasDragged = true;

        currentX = clientX - startX;
        currentY = clientY - startY;
        
        // Use container rect instead of window to respect mobile frame constraints
        const rect = mapContainer.getBoundingClientRect();
        const limitX = Math.max(0, (1500 * currentScale - rect.width) / 2);
        const limitY = Math.max(0, (1000 * currentScale - rect.height) / 2);
        
        currentX = Math.max(-limitX, Math.min(limitX, currentX));
        currentY = Math.max(-limitY, Math.min(limitY, currentY));
        
        updateMapTransform();
    };

    const handleDragEnd = (e) => {
        if (e.touches && e.touches.length < 2) {
            initialDistance = null;
        }
        isDragging = false;
    };

    const handleWheelZoom = (e) => {
        if (currentMapMode === '3D') return;
        e.preventDefault();
        const zoomSensitivity = 0.002;
        currentScale -= e.deltaY * zoomSensitivity;
        
        const rect = mapContainer.getBoundingClientRect();
        const minScale = Math.max(rect.width / 1500, rect.height / 1000); 
        currentScale = Math.max(minScale, Math.min(3, currentScale)); 
        updateMapTransform();
    };

    mapContainer.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mousemove', handleDragMove, { passive: false });
    window.addEventListener('mouseup', handleDragEnd);
    
    mapContainer.addEventListener('touchstart', handleDragStart, { passive: false });
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
    
    mapContainer.addEventListener('wheel', handleWheelZoom, { passive: false });
    
    // Set initial custom property
    gridSystem.style.setProperty('--map-scale', 1);

    // Map Click - Close Bottom Sheet or Open Zone Sheet
    mapContainer.addEventListener('click', (e) => {
        if(hasDragged) return; // prevent triggering click after drag

        const cell = e.target.closest('.grid-cell') || e.target.closest('.grid-cell-3d');
        if (cell && !e.target.closest('.node') && !e.target.closest('.node-3d')) {
            const dataId = cell.dataset.id;
            openBottomSheet({ id: dataId }, true);
            
            // Highlight active zone
            document.querySelectorAll('.grid-cell, .grid-cell-3d').forEach(c => c.classList.remove('active-zone'));
            document.querySelectorAll(`[data-id="${dataId}"]`).forEach(c => c.classList.add('active-zone'));
            
            // deselect nodes
            document.querySelectorAll('.node, .node-3d').forEach(n => n.classList.remove('active'));
            return;
        }

        if (!e.target.closest('.node') && !e.target.closest('.node-3d')) {
            closeBottomSheet();
            document.querySelectorAll('.node, .node-3d').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.grid-cell, .grid-cell-3d').forEach(c => c.classList.remove('active-zone'));
        }
    });

    // Initialize with correct mobile scale
    setTimeout(() => {
        const rect = mapContainer.getBoundingClientRect();
        currentScale = Math.max(rect.width / 1500, rect.height / 1000);
        updateMapTransform();
    }, 100);

    // 2. Bottom Sheet Logic
    const bottomSheet = document.getElementById('node-sheet');
    const startBtn = document.getElementById('start-activity-btn');
    
    function openBottomSheet(item, isZone = false) {
        // Reset Views
        document.getElementById('sheet-info-view').style.display = 'block';
        document.getElementById('sheet-report-view').style.display = 'none';
        document.getElementById('sheet-success-view').style.display = 'none';

        if(isZone) {
            document.getElementById('node-id').innerText = item.id;
            document.getElementById('node-type').innerText = 'GRID SECTOR';
            document.getElementById('node-title').innerText = `Sector ${item.id} Overview`;
            document.getElementById('node-desc').innerText = 'Monitor ecological integrity and report anomalies within this active grid sector.';
            document.getElementById('reward-preview').style.display = 'none';
            document.getElementById('start-activity-btn').style.display = 'none';
            
            const typeEl = document.getElementById('node-type');
            typeEl.style.color = 'var(--text-secondary)';
            typeEl.style.borderColor = 'rgba(255,255,255,0.2)';
            
            document.getElementById('report-zone-id').innerText = `Zone ${item.id}`;
        } else {
            document.getElementById('node-id').innerText = item.id;
            document.getElementById('node-type').innerText = item.type.toUpperCase();
            document.getElementById('node-title').innerText = item.title;
            document.getElementById('node-desc').innerText = item.desc;
            
            document.getElementById('reward-preview').style.display = 'flex';
            document.getElementById('start-activity-btn').style.display = 'flex';
            
            const rewards = document.querySelectorAll('.reward-item span');
            rewards[0].innerText = `+${item.energy} ENERGY`;
            rewards[1].innerText = `+${item.flow} FLOW`;
            
            // Change colors based on type
            const typeEl = document.getElementById('node-type');
            typeEl.style.color = `var(--accent-${item.type === 'zen' ? 'orange' : item.type === 'social' ? 'blue' : 'neon'})`;
            typeEl.style.borderColor = typeEl.style.color;
            
            startBtn.style.background = typeEl.style.color;
            
            document.getElementById('report-zone-id').innerText = `Zone ${item.id}`;
        }

        bottomSheet.classList.add('open');
    }

    function closeBottomSheet() {
        bottomSheet.classList.remove('open');
    }

    // Bottom Sheet Swipe down to close
    let sheetStartY = 0;
    bottomSheet.addEventListener('touchstart', (e) => {
        sheetStartY = e.touches[0].clientY;
    });
    bottomSheet.addEventListener('touchmove', (e) => {
        const y = e.touches[0].clientY;
        if(y > sheetStartY + 50) {
            closeBottomSheet();
            document.querySelectorAll('.node, .node-3d').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.grid-cell, .grid-cell-3d').forEach(c => c.classList.remove('active-zone'));
        }
    });

    // Report functionality
    const openReportBtn = document.getElementById('open-report-btn');
    const submitReportBtn = document.getElementById('submit-report-btn');
    const closeReportBtn = document.getElementById('close-report-btn');
    const photoUploadBtn = document.getElementById('photo-upload-btn');
    
    if (openReportBtn) {
        openReportBtn.addEventListener('click', () => {
            document.getElementById('sheet-info-view').style.display = 'none';
            document.getElementById('sheet-report-view').style.display = 'block';
            
            // Reset form
            document.getElementById('report-note').value = '';
            if (photoUploadBtn) {
                photoUploadBtn.style.background = 'rgba(0,0,0,0.1)';
                photoUploadBtn.style.borderColor = 'rgba(255,255,255,0.2)';
                photoUploadBtn.innerHTML = `<i data-lucide="camera" style="width: 24px; height: 24px; color: var(--text-secondary);"></i>`;
                lucide.createIcons();
            }
        });
    }

    if (photoUploadBtn) {
        photoUploadBtn.addEventListener('click', () => {
            photoUploadBtn.style.background = 'rgba(233, 175, 163, 0.1)';
            photoUploadBtn.style.borderColor = 'var(--accent-orange)';
            photoUploadBtn.innerHTML = `<i data-lucide="check-circle" style="width: 24px; height: 24px; color: var(--accent-orange);"></i>`;
            lucide.createIcons();
        });
    }

    if (submitReportBtn) {
        submitReportBtn.addEventListener('click', () => {
            document.getElementById('sheet-report-view').style.display = 'none';
            document.getElementById('sheet-success-view').style.display = 'block';
            document.getElementById('success-zone-id').innerText = document.getElementById('report-zone-id').innerText;
        });
    }

    if (closeReportBtn) {
        closeReportBtn.addEventListener('click', () => {
            closeBottomSheet();
            document.querySelectorAll('.node, .node-3d').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.grid-cell, .grid-cell-3d').forEach(c => c.classList.remove('active-zone'));
        });
    }

    // 3. Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const globalHeaderTitle = document.getElementById('global-header-title');
    const exploreMapBtn = document.getElementById('explore-map-btn');

    const headerTitles = {
        'view-home': 'KADIKÖY PARK',
        'view-map': 'GRID MAP',
        'view-rewards': 'REWARDS',
        'view-profile': 'MY NETWORK'
    };

    function navigateTo(targetId) {
        // Update Title Context
        if (globalHeaderTitle && headerTitles[targetId]) {
            globalHeaderTitle.innerText = headerTitles[targetId];
        }

        // Update Nav
        navItems.forEach(n => n.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if (activeNav) activeNav.classList.add('active');

        // Update Views
        views.forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(targetId);
        if (targetView) targetView.classList.add('active');
        
        // Close sheet if navigating away
        if(typeof closeBottomSheet === "function") closeBottomSheet();
    }

    if (exploreMapBtn) {
        exploreMapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('view-map');
        });
    }

    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            navigateTo(btn.getAttribute('data-target'));
        });
    });

    // Subtly move user location occasionally to simulate live tracking
    setInterval(() => {
        const offset = Math.random() * 6 - 3; // -3 to +3
        const currentTransform = userLocation.style.transform;
        // Simple animation
        userLocation.style.marginLeft = `${offset}px`;
        userLocation.style.marginTop = `${offset}px`;
    }, 2000);

    // Live Telemetry Updating logic
    const liveVal = document.querySelector('.live-val');
    if(liveVal) {
        setInterval(() => {
            const current = parseInt(liveVal.innerText);
            // randomly fluctuate between 200 and 230 users
            const shift = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            if(current + shift > 200 && current + shift < 230) {
                liveVal.innerText = current + shift;
            }
        }, 3000);
    }

    // 4. Interactive Matrix Flow
    const matrixContainer = document.getElementById('interactive-matrix-container');
    const interactiveMatrix = document.getElementById('interactive-matrix');
    const shockwaveLayer = document.getElementById('shockwave-layer');

    if (matrixContainer && interactiveMatrix) {
        let mdX = 0, mdY = 0;
        let isMatrixDragging = false;

        const attachMatrixInteraction = (e) => {
            isMatrixDragging = true;
            const evt = e.touches ? e.touches[0] : e;
            mdX = evt.clientX;
            mdY = evt.clientY;
            interactiveMatrix.style.transition = 'none';

            // Spawn Shockwave Core
            if (shockwaveLayer) {
                const wave = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                wave.setAttribute("cx", "100");
                wave.setAttribute("cy", "75"); /* isometric center base */
                wave.setAttribute("r", "5");
                wave.setAttribute("fill", "none");
                wave.setAttribute("stroke", "rgba(0, 255, 157, 0.9)");
                wave.classList.add("shockwave-anim");
                shockwaveLayer.appendChild(wave);
                setTimeout(() => { if (shockwaveLayer.contains(wave)) wave.remove(); }, 1500);
            }
        };

        const handleMatrixMove = (e) => {
            if (!isMatrixDragging) return;
            const evt = e.touches ? e.touches[0] : e;
            const deltaX = evt.clientX - mdX;
            const deltaY = evt.clientY - mdY;

            // 3D Parallax Calculation bounds
            const rotX = Math.max(-30, Math.min(30, -deltaY * 0.4));
            const rotY = Math.max(-30, Math.min(30, deltaX * 0.4));

            interactiveMatrix.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(0.92)`;
        };

        const handleMatrixEnd = () => {
            if (isMatrixDragging) {
                isMatrixDragging = false;
                interactiveMatrix.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
                interactiveMatrix.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)`;
            }
        };

        matrixContainer.addEventListener('mousedown', attachMatrixInteraction);
        window.addEventListener('mousemove', handleMatrixMove);
        window.addEventListener('mouseup', handleMatrixEnd);
        
        matrixContainer.addEventListener('touchstart', attachMatrixInteraction);
        window.addEventListener('touchmove', handleMatrixMove);
        window.addEventListener('touchend', handleMatrixEnd);
    }
});
