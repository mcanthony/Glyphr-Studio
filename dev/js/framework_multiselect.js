// start of file
/**
	Multi-Select
	Wrapper object to be used by the UI to handle
	actions that pertain to many selected shapes
	or path points.
**/


//-------------------------------------------------------
// COMMON MULTI-SELECT OBJECT
//-------------------------------------------------------
	function MultiSelect(){
		this.members = [];
		this.handlesingleton = false;
	}

	MultiSelect.prototype.isSelectable = function(obj) {
		if(obj && (
			obj.objtype === 'pathpoint' ||
			obj.objtype === 'shape' ||
			obj.objtype === 'componentinstance'
		)) return true;
		else {
			debug('MultiSelect - cannot select \n' + obj.objtype);
			return false;
		}
	};

	MultiSelect.prototype.select = function(obj) {
		if(this.isSelectable(obj))	this.members = [obj];
		else this.clear();
	};

	MultiSelect.prototype.clear = function(){
		this.members = [];
		if(this.glyph) this.glyph.ratiolock = false;
		this.handlesingleton = false;
	};

	MultiSelect.prototype.add = function(obj){
		if(this.isSelectable(obj) && this.members.indexOf(obj) < 0) this.members.push(obj);
	};

	MultiSelect.prototype.remove = function(obj) {
		this.members = this.members.filter(function (m) {
			return m !== obj;
		});
	};

	MultiSelect.prototype.removeMissing = function() {
		this.members = this.members.filter(function (m) {
			return typeof m === 'object';
		});
	};

	MultiSelect.prototype.toggle = function(obj) {
		if(this.isSelected(obj)) this.remove(obj);
		else this.add(obj);
	};

	MultiSelect.prototype.getType = function() {
		if(this.members.length === 0) return false;
		else if(this.members.length === 1) return this.members[0].objtype;
		else return 'multi';
	};

	MultiSelect.prototype.count = function() {
		return this.members.length;
	};

	MultiSelect.prototype.getMembers = function() {
		return this.members;
	};

	MultiSelect.prototype.getSingleton = function() {
		if(this.members.length === 1) return this.members[0];
		else return false;
	};

	MultiSelect.prototype.isSelected = function(obj) {
		return this.members.indexOf(obj) > -1;
	};



//-------------------------------------------------------
// SELECTED POINTS
//-------------------------------------------------------

	// Initialize fake Shape of multiselected Points
	_UI.ms.points = new MultiSelect();
	_UI.ms.points.shape = new Shape({'name': 'multiselected points', 'path': new Path()});

	_UI.ms.points.getShape = function() {
		this.shape.path = new Path({'pathpoints': this.members});
		this.shape.calcMaxes();
		return this.shape;
	};

	_UI.ms.points.updateShapePosition = function(dx, dy, force){ this.getShape().updateShapePosition(dx, dy, force); };

	_UI.ms.points.deletePathPoints = function() {
		var point, path, pindex;

		for(var m=0; m<this.members.length; m++){
			point = this.members[m];
			path = point.parentpath;
			pindex = point.getPointNum();

			if(pindex > -1){
				path.pathpoints.splice(pindex, 1);
				path.calcMaxes();
			}
		}
		this.clear();

		// if(this.pathpoints.length === 0) deleteShape();
	};

	_UI.ms.points.getSingletonPointNumber = function() {
		if(!this.members[0]) return false;
		else return this.members[0].getPointNum();
	};

	_UI.ms.points.draw_PathPointHandles = function() {
		var sh = this.getShape();
		draw_PathPointHandles(sh.path.pathpoints);
	};

	_UI.ms.points.draw_PathPoints = function(sel) {
		// ('\n MS.points.draw_PathPoints - START');
		var sh = this.getShape();
		// ('\t shape is ' + json(sh));

		draw_PathPoints(sh.path.pathpoints, sel);

		// (' MS.points.draw_PathPoints - END\n');
	};

	_UI.ms.points.setPointType = function(t) {
		for(var m=0; m<this.members.length; m++){
			this.members[m].setPointType(t);
		}
	};

	_UI.ms.points.insertPathPoint = function() {
		var path, pp;
		var newpoints = [];

		for(var m=0; m<this.members.length; m++){
			path = this.members[m].parentpath;
			pp = this.members[m].getPointNum();
			newpoints.push(path.insertPathPoint(false, pp));
		}

		this.clear();

		for(var n=0; n<newpoints.length; n++) this.add(newpoints[n]);
	};

	_UI.ms.points.resetHandles = function() {
		for(var m=0; m<this.members.length; m++){
			debug(this.members[m]);
			this.members[m].resetHandles();
		}
	};

	_UI.ms.points.updatePathPointPosition = function(controlpoint, dx, dy){
		if(controlpoint === 'P'){
			for(var m=0; m<this.members.length; m++){
				this.members[m].updatePathPointPosition(controlpoint, dx, dy);
			}
		} else if(this.handlesingleton){
			this.handlesingleton.updatePathPointPosition(controlpoint, dx, dy);
		}
	};

	function selectShapesThatHaveSelectedPoints() {
		debug('\n selectShapesThatHaveSelectedPoints - START');
		_UI.ms.shapes.clear();
		var points = _UI.ms.points.getMembers();
		var shapes = getSelectedWorkItemShapes();
		var path;
		var count = 0;

		if(points.length === 0) return;

		debug('\t selected points ' + points);
		debug('\t WI shapes ' + shapes);
		
		for(var p=0; p<points.length; p++){
			path = points[p].parentpath;

			for(var s=0; s<shapes.length; s++){
				if(shapes[s].objtype !== 'componentinstance'){
					if(path === shapes[s].path) {
						_UI.ms.shapes.add(shapes[s]);
						count++;
					}
				}
			}
		}

		debug(' selectShapesThatHaveSelectedPoints - Selected ' + count + ' - END\n');
	}

//-------------------------------------------------------
// SELECTED SHAPES
//-------------------------------------------------------

	// Initialize fake Glyph of multiselected shapes
	_UI.ms.shapes = new MultiSelect();
	_UI.ms.shapes.glyph = new Glyph({'name': 'multiselected shapes'});

	_UI.ms.shapes.getGlyph = function() {
		this.glyph.shapes = this.members;
		this.glyph.calcGlyphMaxes();
		return this.glyph;
	};

	// Wrapper functions
	_UI.ms.shapes.updateShapePosition = function(dx, dy, force){ this.getGlyph().updateGlyphPosition(dx, dy, force); };

	_UI.ms.shapes.setShapePosition = function(nx, ny, force) { this.getGlyph().setGlyphPosition(nx, ny, force); };

	_UI.ms.shapes.updateShapeSize = function(dw, dh, ratiolock) {
		_UI.debug = true;
		if(this.members.length === 1) this.members[0].updateShapeSize(dw, dh, ratiolock);
		else if (this.members.length > 1) this.getGlyph().updateGlyphSize(dw, dh, ratiolock);
		_UI.debug = false;
	};

	_UI.ms.shapes.setShapeSize = function(nw, nh, ratiolock) { this.getGlyph().setGlyphSize(nw, nh, ratiolock); };

	_UI.ms.shapes.flipNS = function(mid) { this.getGlyph().flipNS(mid); };

	_UI.ms.shapes.flipEW = function(mid) { this.getGlyph().flipEW(mid); };

	_UI.ms.shapes.getAttribute = function(attr) {
		if(this.members.length === 1) return this.members[0][attr];
		else if (this.members.length > 1) return this.getGlyph()[attr] || false;
		else return false;
	};

	_UI.ms.shapes.deleteShapes = function() {
		// body...
	};

	_UI.ms.shapes.isOverControlPoint = function(x, y, nohandles){
		if(this.members.length === 0) return false;
		var re = false;
		for(var m=0; m<this.members.length; m++){
			re = this.members[m].isOverControlPoint(x, y, nohandles);
			if(re) return re;
		}

		return false;
	};

	_UI.ms.shapes.isOverBoundingBoxHandle = function(px, py) {
		// debug('\n SelectedShapes.isOverBoundingBoxHandle - START');
		// debug('\t passed x/y: ' + px + '/' + py);

		if(this.members.length === 0){
			return false;
		} else if(this.members.length === 1) {
			// debug('\t calling singleton method');
			return this.members[0].isOverBoundingBoxHandle(px, py);
		}

		var c = isOverBoundingBoxHandle(px, py, this.getGlyph().maxes, _UI.multiselectthickness);
		// debug('\t SelectedShapes.isOverBoundingBoxHandle returning ' + c);
		return c;
	};

	_UI.ms.shapes.calcMaxes = function(){
		for(var m=0; m<this.members.length; m++){
			this.members[m].calcMaxes();
		}
	};

	_UI.ms.shapes.getMaxes = function(){
		if(this.members.length === 1) return this.members[0].getMaxes();
		else return this.getGlyph().maxes;
	};

	_UI.ms.shapes.drawShape = function(lctx, view){
		var failed = false;
		var drewshape = false;
		for(var m=0; m<this.members.length; m++){
			drewshape = this.members[m].drawShape(lctx, view);
			failed = failed || !drewshape;
		}

		return !failed;
	};

	_UI.ms.shapes.draw_PathPoints = function(sel) {
		// debug('\n MS.shapes.draw_PathPoints - START');
		var s;
		for(var m=0; m<this.members.length; m++){
			s = this.members[m];
			// debug('\t drawing points on shape ' + m + ' as ' + s.path.pathpoints);
				if(s.objtype !== 'componentinstance') draw_PathPoints(this.members[m].path.pathpoints, sel);
		}

		// debug(' MS.shapes.draw_PathPoints - END\n');
	};

	_UI.ms.shapes.reverseWinding = function(){
		for(var m=0; m<this.members.length; m++){
			this.members[m].reverseWinding();
		}
	};

	_UI.ms.shapes.draw_PathOutline = function(){
		if(this.members.length === 1){
			this.members[0].draw_PathOutline();
		} else {
			for(var m=0; m<this.members.length; m++){
				this.members[m].draw_PathOutline(false, _UI.multiselectthickness);
			}
		}
	};

	_UI.ms.shapes.draw_BoundingBox = function(){
		if(this.members.length === 1){
			this.members[0].draw_BoundingBox();
		} else if(this.members.length > 1){
			var bmaxes = clone(_UI.mins);

			for(var m=0; m<this.members.length; m++){
				bmaxes = getOverallMaxes([bmaxes, this.members[m].getMaxes()]);
			}

			draw_BoundingBox(bmaxes, _UI.colors.gray, _UI.multiselectthickness);
		}
	};

	_UI.ms.shapes.draw_BoundingBoxHandles = function(){
		if(this.members.length === 1){
			this.members[0].draw_BoundingBoxHandles();
		} else if(this.members.length > 1){
			var bmaxes = clone(_UI.mins);

			for(var m=0; m<this.members.length; m++){
				bmaxes = getOverallMaxes([bmaxes, this.members[m].getMaxes()]);
			}

			draw_BoundingBoxHandles(bmaxes, _UI.colors.gray, _UI.multiselectthickness);
		}
	};

// end of file