var models = require('../models/models.js');
models.url = process.env.DATABASE_URL.match(/(.*)\:\/\/(.*?)\:(.*)@(.*)\:(.*)\/(.*)/);
models.dialect = (models.url[1]||null);

// Autoload - factoriza el código si ruta incluye :quizId
exports.load = function(req,res, next, quizId){
//	models.Quiz.findById(quizId).then(
//		function(quiz){
	models.Quiz.find({
		where: { id: Number(quizId) },
        include: [{ model: models.Comment }]
    }).then(function(quiz) {
		if(quiz) {
			req.quiz = quiz;
			next();
		} else { 
			next (new Error('No existe quizId=' + quizId));
		}
	}
	).catch(function(error) { 
		next(error);
	});
};

// GET /quizes/
exports.index = function(req,res){
	req.query.search = req.query.search||"";
	req.query.search = req.query.search.replace(" ", "%");

	var LIKE = "like";
	if(models.dialect === "postgres")
		LIKE = "ilike";

	models.Quiz.findAll({where: ["pregunta " + LIKE + " ?","%"+req.query.search+"%"], order: "pregunta"}).then(
		function(quizes){
			res.render('quizes/index.ejs', {quizes: quizes, search: req.query.search, errors: []});
		}
	).catch(function(error) { 
		next(error);
	});		
};

// GET /quizes/question
exports.show = function(req,res){
	res.render('quizes/show', {quiz: req.quiz, errors: []});
};

// GET /quizes/answer
exports.answer = function(req,res){
	var resultado = 'Incorrecto';
	if(req.query.respuesta === req.quiz.respuesta){
		resultado = 'Correcto';
	}
	res.render('quizes/answer', {quiz: req.quiz, respuesta: resultado, errors: []});
};

// GET /quizes/new
exports.new = function(req,res){
	var quiz = models.Quiz.build(	// Crea objeto quiz
		{pregunta: "pregunta", respuesta: "respuesta", tema: "tema"}
	);
	res.render('quizes/new', {quiz: quiz, errors: []});
};

// POST /quizes/create
exports.create = function(req, res) {
  var quiz = models.Quiz.build( req.body.quiz );

	quiz
  	.validate()
  	.then(
    	function(err){
      		if (err) {
        		res.render('quizes/new', {quiz: quiz, errors: err.errors});
      		} else {
        		quiz // save: guarda en DB campos pregunta y respuesta de quiz
        		.save({fields: ["pregunta", "respuesta", "tema"]})
        		.then( function(){ 
        			res.redirect('/quizes');
        		}); 
      		}   // res.redirect: Redirección HTTP a lista de preguntas
    	}
  	);
}; 

// GET /quizes/:id/edit
exports.edit = function(req,res){
	var quiz = req.quiz; // autoload de instancia de quiz

	res.render('quizes/edit', {quiz: quiz, errors: []});
};

// PUT /quizes/:id
exports.update = function(req, res) {
  	req.quiz.pregunta = req.body.quiz.pregunta;
  	req.quiz.respuesta = req.body.quiz.respuesta;
  	req.quiz.tema = req.body.quiz.tema;

	req.quiz
  	.validate()
  	.then(
    	function(err){
      		if (err) {
        		res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
      		} else {
        		req.quiz // save: guarda en DB campos pregunta y respuesta
        		.save({fields: ["pregunta", "respuesta", "tema"]})
        		.then( function(){ 
        			res.redirect('/quizes');
        		}); 
      		}   // res.redirect: Redirección HTTP a lista de preguntas
    	}
  	);
}; 

// DELETE /quizes/:id
exports.destroy = function(req,res){
	req.quiz.destroy().then( function() {
		res.redirect('/quizes');
	}).catch(function(error){
		next(error);
	});
};

