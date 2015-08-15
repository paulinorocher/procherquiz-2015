var models = require('../models/models.js');
models.url = process.env.DATABASE_URL.match(/(.*)\:\/\/(.*?)\:(.*)@(.*)\:(.*)\/(.*)/);
models.dialect = (models.url[1]||null);

var noQuestions = 0;
var noComments = 0;
var avgCommentsPerQuestion = 0;
var noQuestionsNoComments = 0;
var noQuestionsWithComments = 0;

// 1 - Número total de preguntas
exports.noQuestions = function(req,res,next)
{	
	models.Quiz.findAll()
	.then(function(noQuestionsDB){
		noQuestions = noQuestionsDB.length;
	})
	// Run noComments if no error
	.catch(function(error) { 
		next(error);
	})
	.finally(function () {
		next();
	});
}

// 2 - Número total de comentarios (publicados)
exports.noComments = function(req,res,next)
{
	var published = 1;
	if(models.dialect === "postgres"){
		published = true;
	}

	models.Comment.findAll({where: ["publicado = " + published]})
	.then(function(noCommentsDB){
		noComments = noCommentsDB.length;
		//console.log(">> 2.- noComments: " + noComments);
		//for(k = 0; k < noCommentsDB.length; k++)
		//	console.log("Comentario " + k + " publicado:" + noCommentsDB[k].publicado);
	})
	// Run avgCommentsPerQuestion if no error
	.catch(function(error) {
		next(error);
	})
	.finally(function () {
		next();
	});
}

// 3 - Número medio de comentarios por pregunta
exports.avgCommentsPerQuestion = function(req,res,next)
{
	avgCommentsPerQuestion = (noComments/noQuestions).toFixed(1);
	// Run noQuestionsNoComments
	next();
}

// 5 - Número de preguntas con comentarios (publicados)
exports.noQuestionsNoComments = function(req,res,next)
{
	var published = 1;
	if(models.dialect === "postgres"){
		published = true;
	}

	models.Comment.findAll({where: ["publicado = " + published]})
	.then(function(noQuestionsWithCommentsDB) {
		// El código más elegante del mundo (alerta: sarcasmo)
		var resultado = 0;
		for(i = 0; i < noQuestionsWithCommentsDB.length; i++){
			for(j = i; j < noQuestionsWithCommentsDB.length; j++){
				if(noQuestionsWithCommentsDB[j].QuizId === noQuestionsWithCommentsDB[i].QuizId){
					if(j === i && noQuestionsWithCommentsDB[i].QuizId !== "-1"){
						resultado++;
					}else{
						noQuestionsWithCommentsDB[j].QuizId = "-1";
					}
				}
			}
		}
		noQuestionsWithComments = resultado;
	})
	// Run noQuestionsWithComments if no error
	.catch(function(error) { 
		next(error);
	})
	.finally(function () {
		next();
	});

}

// 4 - Número de preguntas sin comentarios (publicados)
exports.noQuestionsWithComments = function(req,res,next)
{
	noQuestionsNoComments = noQuestions - noQuestionsWithComments;
	// Render statistics page: show
	next();
}

// GET /statistics/
exports.show = function(req,res){
	//console.log("--> SHOW STATISTICS");
	res.render('statistics', { 	noQuestions: noQuestions,
								noComments: noComments,
								avgCommentsPerQuestion: avgCommentsPerQuestion,
								noQuestionsNoComments: noQuestionsNoComments,
								noQuestionWithComments: noQuestionsWithComments,
								errors: []});
}
